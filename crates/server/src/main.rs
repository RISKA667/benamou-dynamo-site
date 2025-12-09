use std::env;

use anyhow::Result;
use async_graphql::{
    http::GraphQLPlaygroundConfig, Context, EmptySubscription, Enum, ID, InputObject, Object,
    Schema, SimpleObject,
};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    extract::{Path, Query, State},
    response::Html,
    routing::get,
    Json, Router,
};
use database::{
    DatabasePool, FamilyChanges, FamilyDraft, FamilyEventNew, FamilyEventRecord, FamilyRepository,
    PersonRepository, PersonUpdate,
};
use genealogy_core::consanguinity::ConsanguinityCalculator;
use genealogy_types::{Family, FamilyId, Person, PersonId, Sex, WizardId};
use chrono::{NaiveDate, Utc};
use serde::Deserialize;
use tokio::signal;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    db: DatabasePool,
    schema: Schema<QueryRoot, MutationRoot, EmptySubscription>,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db = DatabasePool::new(
        &env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://localhost/geneweb".into()),
        &env::var("NEO4J_URL").unwrap_or_else(|_| "neo4j://localhost:7687".into()),
        &env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".into()),
    )
    .await?;

    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(db.clone())
        .finish();

    let state = AppState { db: db.clone(), schema };

    let app = Router::new()
        .route("/", get(index))
        .route(
            "/api/graphql",
            get(graphql_handler).post(graphql_handler),
        )
        .route("/api/persons/:id", get(get_person))
        .route("/api/search", get(search_persons))
        .route("/playground", get(graphql_playground))
        .with_state(state)
        .layer(CorsLayer::permissive());

    let addr = "0.0.0.0:3000";
    tracing::info!("🚀 GeneWeb Rust server listening on {addr}");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("échec de l'écoute de CTRL+C");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Impossible de créer le signal")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}

async fn index() -> &'static str {
    "Genealogy API prête - consultez /api/graphql"
}

async fn graphql_handler(State(state): State<AppState>, req: GraphQLRequest) -> GraphQLResponse {
    state.schema.execute(req.into_inner()).await.into()
}

async fn graphql_playground() -> Html<String> {
    Html(async_graphql::http::playground_source(
        GraphQLPlaygroundConfig::new("/api/graphql")
            .subscription_endpoint("/api/graphql"),
    ))
}

async fn get_person(State(state): State<AppState>, Path(id): Path<Uuid>) -> Json<Option<Person>> {
    let repo = PersonRepository::new(state.db.clone());
    let person = repo.find_by_id(PersonId(id)).await.ok().flatten();
    Json(person)
}

#[derive(Debug, Deserialize)]
struct SearchQuery {
    surname: String,
    first_name: String,
}

async fn search_persons(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> Json<Vec<Person>> {
    let repo = PersonRepository::new(state.db.clone());
    let persons = repo
        .search_by_name(&query.surname, &query.first_name)
        .await
        .unwrap_or_default();
    Json(persons)
}

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn person(&self, ctx: &Context<'_>, id: ID) -> async_graphql::Result<Option<PersonPayload>> {
        let uuid = parse_uuid(&id)?;
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = PersonRepository::new(db);
        Ok(repo
            .find_by_id(PersonId(uuid))
            .await?
            .map(PersonPayload::from))
    }

    async fn search_persons(
        &self,
        ctx: &Context<'_>,
        surname: String,
        first_name: String,
    ) -> async_graphql::Result<Vec<PersonPayload>> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = PersonRepository::new(db);
        let persons = repo.search_by_name(&surname, &first_name).await?;
        Ok(persons.into_iter().map(PersonPayload::from).collect())
    }

    async fn ancestors(
        &self,
        ctx: &Context<'_>,
        person_id: ID,
        generations: u32,
    ) -> async_graphql::Result<Vec<PersonPayload>> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let uuid = parse_uuid(&person_id)?;
        let query = neo4rs::query(
            "MATCH (p:Person {id: $id})-[:CHILD_OF*1..$gen]->(ancestor:Person) RETURN ancestor.id as id",
        )
        .param("id", uuid.to_string())
        .param("gen", generations as i64);

        let mut result = db.neo4j.execute(query).await?;
        let mut ids = Vec::new();
        while let Some(row) = result.next().await? {
            let id: String = row.get("id")?;
            ids.push(Uuid::parse_str(&id)?);
        }

        let repo = PersonRepository::new(db);
        let mut ancestors = Vec::new();
        for id in ids {
            if let Some(person) = repo.find_by_id(PersonId(id)).await? {
                ancestors.push(PersonPayload::from(person));
            }
        }
        Ok(ancestors)
    }

    async fn consanguinity(
        &self,
        ctx: &Context<'_>,
        person_id: ID,
    ) -> async_graphql::Result<f64> {
        let uuid = parse_uuid(&person_id)?;
        let db = ctx.data::<DatabasePool>()?.clone();
        let mut calculator = ConsanguinityCalculator::new(db);
        Ok(calculator.calculate(PersonId(uuid)).await?)
    }

    async fn calculate_relationship(
        &self,
        ctx: &Context<'_>,
        person1_id: ID,
        person2_id: ID,
    ) -> async_graphql::Result<Option<RelationshipPayload>> {
        let uuid1 = parse_uuid(&person1_id)?;
        let uuid2 = parse_uuid(&person2_id)?;
        let db = ctx.data::<DatabasePool>()?.clone();
        let query = neo4rs::query(
            "MATCH path = shortestPath((p1:Person {id: $id1})-[*]-(p2:Person {id: $id2})) RETURN length(path) as distance",
        )
        .param("id1", uuid1.to_string())
        .param("id2", uuid2.to_string());

        let mut result = db.neo4j.execute(query).await?;
        if let Some(row) = result.next().await? {
            let distance: i64 = row.get("distance")?;
            Ok(Some(RelationshipPayload {
                person1: person1_id,
                person2: person2_id,
                degree: distance as u32,
                description: format_relationship(distance as u32),
            }))
        } else {
            Ok(None)
        }
    }
}

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn create_person(
        &self,
        ctx: &Context<'_>,
        input: CreatePersonInput,
    ) -> async_graphql::Result<PersonPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = PersonRepository::new(db.clone());
        let now = Utc::now().naive_utc();
        let CreatePersonInput {
            first_name,
            surname,
            surname_prefix,
            nicknames,
            sex,
            notes,
            wizard_id,
        } = input;
        let updated_by = parse_optional_wizard_id(wizard_id)?;
        let person = Person {
            id: PersonId(Uuid::new_v4()),
            first_name,
            surname,
            surname_prefix,
            nicknames: nicknames.unwrap_or_default(),
            sex: sex.into(),
            birth: None,
            death: None,
            other_events: Vec::new(),
            occupation: Vec::new(),
            titles: Vec::new(),
            notes,
            sources: Vec::new(),
            images: Vec::new(),
            public: true,
            created_at: now,
            updated_at: now,
            updated_by,
        };

        repo.create(&person).await?;
        Ok(person.into())
    }

    async fn update_person(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: UpdatePersonInput,
    ) -> async_graphql::Result<PersonPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = PersonRepository::new(db);
        let UpdatePersonInput {
            first_name,
            surname,
            surname_prefix,
            sex,
            notes,
            public,
            wizard_id,
        } = input;
        let updates = PersonUpdate {
            first_name,
            surname,
            surname_prefix,
            sex: sex.map(Into::into),
            notes,
            public,
            updated_by: parse_optional_wizard_id(wizard_id)?,
        };

        let updated = repo
            .update(PersonId(parse_uuid(&id)?), updates)
            .await?
            .ok_or_else(|| async_graphql::Error::new("Personne introuvable"))?;

        Ok(updated.into())
    }

    async fn set_person_privacy(
        &self,
        ctx: &Context<'_>,
        id: ID,
        public: bool,
        wizard_id: Option<ID>,
    ) -> async_graphql::Result<PersonPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = PersonRepository::new(db);
        let updated = repo
            .update(
                PersonId(parse_uuid(&id)?),
                PersonUpdate {
                    first_name: None,
                    surname: None,
                    surname_prefix: None,
                    sex: None,
                    notes: None,
                    public: Some(public),
                    updated_by: parse_optional_wizard_id(wizard_id)?,
                },
            )
            .await?
            .ok_or_else(|| async_graphql::Error::new("Personne introuvable"))?;
        Ok(updated.into())
    }

    async fn create_family(
        &self,
        ctx: &Context<'_>,
        input: CreateFamilyInput,
    ) -> async_graphql::Result<FamilyPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = FamilyRepository::new(db);
        let children = ids_to_person_ids(input.child_ids)?;
        let family = repo
            .create(FamilyDraft {
                id: FamilyId(Uuid::new_v4()),
                father_id: parse_optional_person_id(input.father_id)?,
                mother_id: parse_optional_person_id(input.mother_id)?,
                children,
                notes: input.notes,
                public: input.public.unwrap_or(true),
            })
            .await?;
        Ok(family.into())
    }

    async fn update_family(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: UpdateFamilyInput,
    ) -> async_graphql::Result<FamilyPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = FamilyRepository::new(db);
        let child_ids = match input.child_ids {
            Some(ids) => Some(ids_to_person_ids(ids)?),
            None => None,
        };
        let updated = repo
            .update(
                FamilyId(parse_uuid(&id)?),
                FamilyChanges {
                    father_id: parse_nullable_person_id(input.father_id)?,
                    mother_id: parse_nullable_person_id(input.mother_id)?,
                    children: child_ids,
                    notes: input.notes,
                    public: input.public,
                },
            )
            .await?;

        match updated {
            Some(family) => Ok(family.into()),
            None => Err(async_graphql::Error::new("Famille introuvable")),
        }
    }

    async fn add_family_child(
        &self,
        ctx: &Context<'_>,
        family_id: ID,
        child_id: ID,
    ) -> async_graphql::Result<FamilyPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = FamilyRepository::new(db);
        let family = repo
            .append_child(
                FamilyId(parse_uuid(&family_id)?),
                PersonId(parse_uuid(&child_id)?),
            )
            .await?;
        Ok(family.into())
    }

    async fn remove_family_child(
        &self,
        ctx: &Context<'_>,
        family_id: ID,
        child_id: ID,
    ) -> async_graphql::Result<FamilyPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = FamilyRepository::new(db);
        let family = repo
            .remove_child(
                FamilyId(parse_uuid(&family_id)?),
                PersonId(parse_uuid(&child_id)?),
            )
            .await?;
        Ok(family.into())
    }

    async fn set_family_privacy(
        &self,
        ctx: &Context<'_>,
        family_id: ID,
        public: bool,
    ) -> async_graphql::Result<FamilyPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = FamilyRepository::new(db);
        let family = repo
            .set_privacy(FamilyId(parse_uuid(&family_id)?), public)
            .await?;
        Ok(family.into())
    }

    async fn add_family_event(
        &self,
        ctx: &Context<'_>,
        family_id: ID,
        event: FamilyEventInput,
    ) -> async_graphql::Result<FamilyEventPayload> {
        let db = ctx.data::<DatabasePool>()?.clone();
        let repo = FamilyRepository::new(db);
        let record = repo
            .add_event(FamilyEventNew {
                family_id: FamilyId(parse_uuid(&family_id)?),
                event_type: event.event_type,
                date: parse_optional_date(event.date)?,
                notes: event.notes,
            })
            .await?;
        Ok(record.into())
    }
}

#[derive(InputObject)]
struct CreatePersonInput {
    first_name: String,
    surname: String,
    surname_prefix: Option<String>,
    nicknames: Option<Vec<String>>,
    sex: SexGql,
    notes: Option<String>,
    wizard_id: Option<ID>,
}

#[derive(InputObject)]
struct UpdatePersonInput {
    first_name: Option<String>,
    surname: Option<String>,
    surname_prefix: Option<Option<String>>,
    sex: Option<SexGql>,
    notes: Option<Option<String>>,
    public: Option<bool>,
    wizard_id: Option<ID>,
}

#[derive(InputObject)]
struct CreateFamilyInput {
    father_id: Option<ID>,
    mother_id: Option<ID>,
    child_ids: Vec<ID>,
    notes: Option<String>,
    public: Option<bool>,
}

#[derive(InputObject)]
struct UpdateFamilyInput {
    father_id: Option<Option<ID>>,
    mother_id: Option<Option<ID>>,
    child_ids: Option<Vec<ID>>,
    notes: Option<Option<String>>,
    public: Option<bool>,
}

#[derive(InputObject)]
struct FamilyEventInput {
    event_type: String,
    date: Option<String>,
    notes: Option<String>,
}

#[derive(SimpleObject)]
struct RelationshipPayload {
    person1: ID,
    person2: ID,
    degree: u32,
    description: String,
}

fn format_relationship(degree: u32) -> String {
    match degree {
        0 => "Même personne".into(),
        1 => "Lien parent/enfant".into(),
        2 => "Fratrie ou grand-parent".into(),
        3 => "Oncle/Tante ou arrière-grand-parent".into(),
        n => format!("Relation au {}e degré", n),
    }
}

#[derive(Clone, SimpleObject)]
struct PersonPayload {
    id: ID,
    first_name: String,
    surname: String,
    surname_prefix: Option<String>,
    nicknames: Vec<String>,
    sex: SexGql,
    public: bool,
    notes: Option<String>,
    updated_by: Option<ID>,
}

impl From<Person> for PersonPayload {
    fn from(person: Person) -> Self {
        Self {
            id: ID::from(person.id.0.to_string()),
            first_name: person.first_name,
            surname: person.surname,
            surname_prefix: person.surname_prefix,
            nicknames: person.nicknames,
            sex: person.sex.into(),
            public: person.public,
            notes: person.notes,
            updated_by: person.updated_by.map(|wizard| ID::from(wizard.0.to_string())),
        }
    }
}

#[derive(Clone, SimpleObject)]
struct FamilyEventPayload {
    id: ID,
    family_id: ID,
    event_type: String,
    date: Option<String>,
    notes: Option<String>,
}

impl From<FamilyEventRecord> for FamilyEventPayload {
    fn from(record: FamilyEventRecord) -> Self {
        Self {
            id: ID::from(record.id.to_string()),
            family_id: ID::from(record.family_id.0.to_string()),
            event_type: record.event_type,
            date: record.date.map(|d| d.to_string()),
            notes: record.notes,
        }
    }
}

#[derive(Clone, SimpleObject)]
struct FamilyPayload {
    id: ID,
    father_id: Option<ID>,
    mother_id: Option<ID>,
    child_ids: Vec<ID>,
    public: bool,
    notes: Option<String>,
}

impl From<Family> for FamilyPayload {
    fn from(family: Family) -> Self {
        Self {
            id: ID::from(family.id.0.to_string()),
            father_id: family.father.map(|id| ID::from(id.0.to_string())),
            mother_id: family.mother.map(|id| ID::from(id.0.to_string())),
            child_ids: family
                .children
                .into_iter()
                .map(|child| ID::from(child.0.to_string()))
                .collect(),
            public: family.public,
            notes: family.notes,
        }
    }
}

#[derive(Clone, Copy, Enum, Eq, PartialEq)]
enum SexGql {
    Male,
    Female,
    Unknown,
}

impl From<Sex> for SexGql {
    fn from(value: Sex) -> Self {
        match value {
            Sex::Male => SexGql::Male,
            Sex::Female => SexGql::Female,
            Sex::Unknown => SexGql::Unknown,
        }
    }
}

impl From<SexGql> for Sex {
    fn from(value: SexGql) -> Self {
        match value {
            SexGql::Male => Sex::Male,
            SexGql::Female => Sex::Female,
            SexGql::Unknown => Sex::Unknown,
        }
    }
}

fn parse_optional_person_id(value: Option<ID>) -> async_graphql::Result<Option<PersonId>> {
    match value {
        Some(id) => parse_uuid(&id).map(|uuid| Some(PersonId(uuid))),
        None => Ok(None),
    }
}

fn parse_nullable_person_id(
    value: Option<Option<ID>>,
) -> async_graphql::Result<Option<Option<PersonId>>> {
    match value {
        Some(Some(id)) => parse_uuid(&id).map(|uuid| Some(Some(PersonId(uuid)))),
        Some(None) => Ok(Some(None)),
        None => Ok(None),
    }
}

fn ids_to_person_ids(ids: Vec<ID>) -> async_graphql::Result<Vec<PersonId>> {
    ids.into_iter()
        .map(|id| parse_uuid(&id).map(PersonId))
        .collect()
}

fn parse_optional_wizard_id(id: Option<ID>) -> async_graphql::Result<Option<WizardId>> {
    match id {
        Some(value) => parse_uuid(&value).map(|uuid| Some(WizardId(uuid))),
        None => Ok(None),
    }
}

fn parse_optional_date(value: Option<String>) -> async_graphql::Result<Option<NaiveDate>> {
    match value {
        Some(raw) => NaiveDate::parse_from_str(&raw, "%Y-%m-%d")
            .map(Some)
            .map_err(|err| async_graphql::Error::new(format!("Date invalide: {err}"))),
        None => Ok(None),
    }
}

fn parse_uuid(id: &ID) -> async_graphql::Result<Uuid> {
    Uuid::parse_str(id.as_str()).map_err(|err| async_graphql::Error::new(err.to_string()))
}

pub type GenealogySchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;
