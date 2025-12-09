use anyhow::{anyhow, Result};
use genealogy_types::{Family, FamilyId, Person, PersonId, Sex, WizardId};
use neo4rs::{query, Graph};
use redis::{aio::ConnectionManager, AsyncCommands};
use serde_json::json;
use sqlx::{postgres::PgPoolOptions, PgPool, Row, Transaction, QueryBuilder, Postgres};
use chrono::{NaiveDate, NaiveDateTime};
use uuid::Uuid;

type PgTx<'a> = Transaction<'a, Postgres>;

/// Pools partagés pour l'ensemble de l'application.
#[derive(Clone)]
pub struct DatabasePool {
    pub postgres: PgPool,
    pub neo4j: Graph,
    pub redis: ConnectionManager,
}

impl DatabasePool {
    pub async fn new(postgres_url: &str, neo4j_url: &str, redis_url: &str) -> Result<Self> {
        let postgres = PgPoolOptions::new()
            .max_connections(50)
            .connect(postgres_url)
            .await?;

        let neo4j = Graph::new(neo4j_url, "", "").await?;

        let redis_client = redis::Client::open(redis_url)?;
        let redis = ConnectionManager::new(redis_client).await?;

        Ok(Self {
            postgres,
            neo4j,
            redis,
        })
    }
}

/// Repository centré sur les personnes.
pub struct PersonRepository {
    pub pool: DatabasePool,
}

pub struct PersonUpdate {
    pub first_name: Option<String>,
    pub surname: Option<String>,
    pub surname_prefix: Option<Option<String>>,
    pub sex: Option<Sex>,
    pub notes: Option<Option<String>>,
    pub public: Option<bool>,
    pub updated_by: Option<WizardId>,
}

impl PersonUpdate {
    fn has_changes(&self) -> bool {
        self.first_name.is_some()
            || self.surname.is_some()
            || self.surname_prefix.is_some()
            || self.sex.is_some()
            || self.notes.is_some()
            || self.public.is_some()
            || self.updated_by.is_some()
    }
}

impl PersonRepository {
    pub fn new(pool: DatabasePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, person: &Person) -> Result<PersonId> {
        let mut tx = self.pool.postgres.begin().await?;

        sqlx::query(
            r#"
            INSERT INTO persons (id, first_name, surname, surname_prefix, sex, public, notes, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(person.id.0)
        .bind(&person.first_name)
        .bind(&person.surname)
        .bind(&person.surname_prefix)
        .bind(format!("{:?}", person.sex))
        .bind(person.public)
        .bind(&person.notes)
        .bind(person.updated_by.map(|w| w.0))
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        self.create_neo4j_node(&person.id).await?;
        self.invalidate_cache(&person.id).await?;

        Ok(person.id)
    }

    pub async fn find_by_id(&self, id: PersonId) -> Result<Option<Person>> {
        if let Some(person) = self.get_from_cache(&id).await? {
            return Ok(Some(person));
        }

        let row = sqlx::query(
            r#"
            SELECT id, first_name, surname, surname_prefix, sex, public, notes,
                   created_at, updated_at, updated_by
            FROM persons
            WHERE id = $1
            "#,
        )
        .bind(id.0)
        .fetch_optional(&self.pool.postgres)
        .await?;

        let person = row.map(|r| row_to_person(&r));

        if let Some(ref p) = person {
            self.set_cache(p).await?;
        }

        Ok(person)
    }

    pub async fn search_by_name(&self, surname: &str, first_name: &str) -> Result<Vec<Person>> {
        let rows = sqlx::query(
            r#"
            SELECT id, first_name, surname, surname_prefix, sex, public, notes,
                   created_at, updated_at, updated_by
            FROM persons
            WHERE (surname || ' ' || first_name) ILIKE $1
            ORDER BY surname, first_name
            LIMIT 50
            "#,
        )
        .bind(format!("%{} {}%", surname, first_name))
        .fetch_all(&self.pool.postgres)
        .await?;

        Ok(rows.iter().map(row_to_person).collect())
    }

    pub async fn update(&self, id: PersonId, updates: PersonUpdate) -> Result<Option<Person>> {
        if !updates.has_changes() {
            return self.find_by_id(id).await;
        }

        let existing = self.find_by_id(id).await?;
        if existing.is_none() {
            return Ok(None);
        }
        let previous_public = existing.as_ref().map(|p| p.public).unwrap_or(true);

        let PersonUpdate {
            first_name,
            surname,
            surname_prefix,
            sex,
            notes,
            public,
            updated_by,
        } = updates;

        let mut builder = QueryBuilder::<Postgres>::new("UPDATE persons SET ");
        let mut separated = builder.separated(", ");

        if let Some(value) = first_name {
            separated.push("first_name = ");
            separated.push_bind(value);
        }
        if let Some(value) = surname {
            separated.push("surname = ");
            separated.push_bind(value);
        }
        if let Some(prefix_option) = surname_prefix {
            separated.push("surname_prefix = ");
            match prefix_option {
                Some(prefix) => separated.push_bind(prefix),
                None => separated.push("NULL"),
            };
        }
        if let Some(sex) = sex {
            separated.push("sex = ");
            separated.push_bind(format!("{:?}", sex));
        }
        if let Some(notes_option) = notes {
            separated.push("notes = ");
            match notes_option {
                Some(notes) => separated.push_bind(notes),
                None => separated.push("NULL"),
            };
        }
        if let Some(public) = public {
            separated.push("public = ");
            separated.push_bind(public);
        }
        if let Some(wizard) = updated_by {
            separated.push("updated_by = ");
            separated.push_bind(wizard.0);
        }
        separated.push("updated_at = NOW()");

        builder.push(" WHERE id = ");
        builder.push_bind(id.0);
        builder.push(
            " RETURNING id, first_name, surname, surname_prefix, sex, public, notes, created_at, updated_at, updated_by",
        );

        let row = builder
            .build()
            .fetch_optional(&self.pool.postgres)
            .await?;

        let person = row.map(|r| row_to_person(&r));

        if let Some(ref updated) = person {
            if let Some(new_public) = public {
                if new_public != previous_public {
                    self.log_privacy_change(&id, updated_by, previous_public, new_public)
                        .await?;
                }
            }
            self.set_cache(updated).await?;
        }

        Ok(person)
    }

    async fn create_neo4j_node(&self, person_id: &PersonId) -> Result<()> {
        let query = query("MERGE (:Person {id: $id})").param("id", person_id.0.to_string());
        self.pool.neo4j.run(query).await?;
        Ok(())
    }

    async fn invalidate_cache(&self, person_id: &PersonId) -> Result<()> {
        let mut conn = self.pool.redis.clone();
        let key = format!("person:{}", person_id.0);
        conn.del::<_, ()>(key).await?;
        Ok(())
    }

    async fn get_from_cache(&self, person_id: &PersonId) -> Result<Option<Person>> {
        let mut conn = self.pool.redis.clone();
        let key = format!("person:{}", person_id.0);
        let cached: Option<String> = conn.get(key).await?;
        match cached {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    async fn set_cache(&self, person: &Person) -> Result<()> {
        let mut conn = self.pool.redis.clone();
        let key = format!("person:{}", person.id.0);
        let json = serde_json::to_string(person)?;
        conn.set_ex::<_, _, ()>(key, json, 3600).await?;
        Ok(())
    }

    async fn log_privacy_change(
        &self,
        person_id: &PersonId,
        changed_by: Option<WizardId>,
        old_public: bool,
        new_public: bool,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO privacy_logs (id, person_id, changed_by, old_public, new_public)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(uuid::Uuid::new_v4())
        .bind(person_id.0)
        .bind(changed_by.map(|w| w.0))
        .bind(old_public)
        .bind(new_public)
        .execute(&self.pool.postgres)
        .await?;
        Ok(())
    }
}

fn row_to_person(row: &sqlx::postgres::PgRow) -> Person {
    use chrono::NaiveDateTime;
    let created_at: NaiveDateTime = row.get("created_at");
    let updated_at: NaiveDateTime = row.get("updated_at");
    let id = row.get::<uuid::Uuid, _>("id");
    let sex_str: String = row.get("sex");

    Person {
        id: PersonId(id),
        first_name: row.get("first_name"),
        surname: row.get("surname"),
        surname_prefix: row.get::<Option<String>, _>("surname_prefix"),
        nicknames: Vec::new(),
        sex: parse_sex(&sex_str),
        birth: None,
        death: None,
        other_events: Vec::new(),
        occupation: Vec::new(),
        titles: Vec::new(),
        notes: row.get::<Option<String>, _>("notes"),
        sources: Vec::new(),
        images: Vec::new(),
        public: row.get("public"),
        created_at,
        updated_at,
        updated_by: row
            .get::<Option<Uuid>, _>("updated_by")
            .map(WizardId),
    }
}

fn parse_sex(input: &str) -> Sex {
    match input {
        "Male" | "male" | "M" => Sex::Male,
        "Female" | "female" | "F" => Sex::Female,
        _ => Sex::Unknown,
    }
}

/// Utilitaire pour générer un snapshot JSON simplifié.
pub fn person_summary(person: &Person) -> serde_json::Value {
    json!({
        "id": person.id.0,
        "name": format!("{} {}", person.first_name, person.surname),
        "public": person.public,
    })
}

pub struct FamilyDraft {
    pub id: FamilyId,
    pub father_id: Option<PersonId>,
    pub mother_id: Option<PersonId>,
    pub children: Vec<PersonId>,
    pub notes: Option<String>,
    pub public: bool,
}

#[derive(Default)]
pub struct FamilyChanges {
    pub father_id: Option<Option<PersonId>>,
    pub mother_id: Option<Option<PersonId>>,
    pub children: Option<Vec<PersonId>>,
    pub notes: Option<Option<String>>,
    pub public: Option<bool>,
}

impl FamilyChanges {
    fn has_changes(&self) -> bool {
        self.father_id.is_some()
            || self.mother_id.is_some()
            || self.children.is_some()
            || self.notes.is_some()
            || self.public.is_some()
    }
}

pub struct FamilyEventNew {
    pub family_id: FamilyId,
    pub event_type: String,
    pub date: Option<NaiveDate>,
    pub notes: Option<String>,
}

pub struct FamilyEventRecord {
    pub id: Uuid,
    pub family_id: FamilyId,
    pub event_type: String,
    pub date: Option<NaiveDate>,
    pub notes: Option<String>,
}

pub struct FamilyRepository {
    pub pool: DatabasePool,
}

impl FamilyRepository {
    pub fn new(pool: DatabasePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, draft: FamilyDraft) -> Result<Family> {
        let mut tx = self.pool.postgres.begin().await?;

        sqlx::query(
            r#"
            INSERT INTO families (id, father_id, mother_id, notes, public)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(draft.id.0)
        .bind(draft.father_id.map(|id| id.0))
        .bind(draft.mother_id.map(|id| id.0))
        .bind(draft.notes.as_deref())
        .bind(draft.public)
        .execute(&mut *tx)
        .await?;

        self.replace_children(&mut tx, draft.id, &draft.children).await?;

        tx.commit().await?;

        self.link_family_edges(&draft.children, draft.father_id, draft.mother_id)
            .await?;

        self.find_by_id(draft.id)
            .await?
            .ok_or_else(|| anyhow!("Family not found after creation"))
    }

    pub async fn update(&self, id: FamilyId, changes: FamilyChanges) -> Result<Option<Family>> {
        if !changes.has_changes() {
            return self.find_by_id(id).await;
        }

        let FamilyChanges {
            father_id,
            mother_id,
            children,
            notes,
            public,
        } = changes;

        let father_field = father_id;
        let mother_field = mother_id;
        let notes_field = notes;
        let public_field = public;

        let mut tx = self.pool.postgres.begin().await?;

        if father_field.is_some()
            || mother_field.is_some()
            || notes_field.is_some()
            || public_field.is_some()
        {
            let mut builder = QueryBuilder::<Postgres>::new("UPDATE families SET ");
            let mut separated = builder.separated(", ");

            if let Some(ref father) = father_field {
                separated.push("father_id = ");
                match father {
                    Some(fid) => separated.push_bind(fid.0),
                    None => separated.push("NULL"),
                };
            }

            if let Some(ref mother) = mother_field {
                separated.push("mother_id = ");
                match mother {
                    Some(mid) => separated.push_bind(mid.0),
                    None => separated.push("NULL"),
                };
            }

            if let Some(ref notes) = notes_field {
                separated.push("notes = ");
                match notes {
                    Some(text) => separated.push_bind(text),
                    None => separated.push("NULL"),
                };
            }

            if let Some(public) = public_field {
                separated.push("public = ");
                separated.push_bind(public);
            }

            separated.push("updated_at = NOW()");

            builder.push(" WHERE id = ");
            builder.push_bind(id.0);
            builder.build().execute(&mut *tx).await?;
        }

        let father_for_edges = father_field.and_then(|opt| opt);
        let mother_for_edges = mother_field.and_then(|opt| opt);

        if let Some(children) = children {
            self.replace_children(&mut tx, id, &children).await?;
            self.link_family_edges(&children, father_for_edges, mother_for_edges)
                .await?;
        } else if father_field.is_some() || mother_field.is_some() {
            let current_children = self.fetch_children_inner(&mut tx, id).await?;
            self.link_family_edges(
                &current_children,
                father_for_edges,
                mother_for_edges,
            )
            .await?;
        }

        tx.commit().await?;

        self.find_by_id(id).await
    }

    pub async fn append_child(&self, id: FamilyId, child: PersonId) -> Result<Family> {
        let family = self
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow!("Family not found"))?;
        let mut children = family.children;
        if !children.iter().any(|c| c.0 == child.0) {
            children.push(child);
        }
        self.update(
            id,
            FamilyChanges {
                children: Some(children),
                ..Default::default()
            },
        )
        .await?
        .ok_or_else(|| anyhow!("Family not found after update"))
    }

    pub async fn remove_child(&self, id: FamilyId, child: PersonId) -> Result<Family> {
        let family = self
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow!("Family not found"))?;
        let children: Vec<PersonId> = family
            .children
            .into_iter()
            .filter(|c| c.0 != child.0)
            .collect();
        self.update(
            id,
            FamilyChanges {
                children: Some(children),
                ..Default::default()
            },
        )
        .await?
        .ok_or_else(|| anyhow!("Family not found after update"))
    }

    pub async fn set_privacy(&self, id: FamilyId, public: bool) -> Result<Family> {
        self.update(
            id,
            FamilyChanges {
                public: Some(public),
                ..Default::default()
            },
        )
        .await?
        .ok_or_else(|| anyhow!("Family not found after update"))
    }

    pub async fn add_event(&self, event: FamilyEventNew) -> Result<FamilyEventRecord> {
        let date_type = if event.date.is_some() { "exact" } else { "unknown" };
        let row = sqlx::query(
            r#"
            INSERT INTO events (id, family_id, event_type, date_type, date_value, person_id, notes)
            VALUES ($1, $2, $3, $4, $5, NULL, $6)
            RETURNING id, family_id, event_type, date_value, notes
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(event.family_id.0)
        .bind(&event.event_type)
        .bind(date_type)
        .bind(event.date)
        .bind(event.notes.as_deref())
        .fetch_one(&self.pool.postgres)
        .await?;

        Ok(FamilyEventRecord {
            id: row.get::<Uuid, _>("id"),
            family_id: FamilyId(row.get::<Uuid, _>("family_id")),
            event_type: row.get("event_type"),
            date: row.get::<Option<NaiveDate>, _>("date_value"),
            notes: row.get::<Option<String>, _>("notes"),
        })
    }

    pub async fn find_by_id(&self, id: FamilyId) -> Result<Option<Family>> {
        let row = sqlx::query(
            r#"
            SELECT id, father_id, mother_id, notes, public, created_at, updated_at
            FROM families
            WHERE id = $1
            "#,
        )
        .bind(id.0)
        .fetch_optional(&self.pool.postgres)
        .await?;

        if let Some(row) = row {
            let children = self.fetch_children(id).await?;
            Ok(Some(row_to_family(&row, children)))
        } else {
            Ok(None)
        }
    }

    async fn replace_children(
        &self,
        tx: &mut PgTx<'_>,
        family_id: FamilyId,
        children: &[PersonId],
    ) -> Result<()> {
        sqlx::query("DELETE FROM family_children WHERE family_id = $1")
            .bind(family_id.0)
            .execute(&mut **tx)
            .await?;

        for (order, child) in children.iter().enumerate() {
            sqlx::query(
                r#"
                INSERT INTO family_children (family_id, child_id, child_order)
                VALUES ($1, $2, $3)
                "#,
            )
            .bind(family_id.0)
            .bind(child.0)
            .bind(order as i32)
            .execute(&mut **tx)
            .await?;
        }
        Ok(())
    }

    async fn link_family_edges(
        &self,
        children: &[PersonId],
        father: Option<PersonId>,
        mother: Option<PersonId>,
    ) -> Result<()> {
        for child in children {
            if let Some(father) = father {
                self.link_child_parent(child, &father).await?;
            }
            if let Some(mother) = mother {
                self.link_child_parent(child, &mother).await?;
            }
        }
        Ok(())
    }

    async fn link_child_parent(
        &self,
        child: &PersonId,
        parent: &PersonId,
    ) -> Result<()> {
        let cypher = query(
            "MATCH (c:Person {id: $child}), (p:Person {id: $parent})
             MERGE (c)-[:CHILD_OF]->(p)",
        )
        .param("child", child.0.to_string())
        .param("parent", parent.0.to_string());
        self.pool.neo4j.run(cypher).await?;
        Ok(())
    }

    async fn fetch_children(&self, family_id: FamilyId) -> Result<Vec<PersonId>> {
        let rows = sqlx::query(
            r#"
            SELECT child_id
            FROM family_children
            WHERE family_id = $1
            ORDER BY child_order
            "#,
        )
        .bind(family_id.0)
        .fetch_all(&self.pool.postgres)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| PersonId(row.get::<Uuid, _>("child_id")))
            .collect())
    }

    async fn fetch_children_inner(
        &self,
        tx: &mut PgTx<'_>,
        family_id: FamilyId,
    ) -> Result<Vec<PersonId>> {
        let rows = sqlx::query(
            r#"
            SELECT child_id
            FROM family_children
            WHERE family_id = $1
            ORDER BY child_order
            "#,
        )
        .bind(family_id.0)
        .fetch_all(&mut **tx)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| PersonId(row.get::<Uuid, _>("child_id")))
            .collect())
    }
}

fn row_to_family(row: &sqlx::postgres::PgRow, children: Vec<PersonId>) -> Family {
    let created_at: NaiveDateTime = row.get("created_at");
    let updated_at: NaiveDateTime = row.get("updated_at");
    Family {
        id: FamilyId(row.get::<Uuid, _>("id")),
        father: row.get::<Option<Uuid>, _>("father_id").map(PersonId),
        mother: row.get::<Option<Uuid>, _>("mother_id").map(PersonId),
        children,
        marriage: None,
        divorce: None,
        other_events: Vec::new(),
        notes: row.get::<Option<String>, _>("notes"),
        sources: Vec::new(),
        public: row.get("public"),
        created_at,
        updated_at,
    }
}
