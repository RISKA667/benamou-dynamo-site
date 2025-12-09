use std::collections::HashMap;

use anyhow::Result;
use async_recursion::async_recursion;
use database::DatabasePool;
use genealogy_types::PersonId;
use neo4rs::query;
use uuid::Uuid;

/// Calculateur de consanguinité basé sur Neo4j + PostgreSQL.
pub struct ConsanguinityCalculator {
    db: DatabasePool,
    cache: HashMap<PersonId, f64>,
}

impl ConsanguinityCalculator {
    pub fn new(db: DatabasePool) -> Self {
        Self {
            db,
            cache: HashMap::new(),
        }
    }

    /// Formule GeneWeb: F = Σ(1/2)^(n+1) * (1 + F_ancestor)
    #[async_recursion]
    pub async fn calculate(&mut self, person_id: PersonId) -> Result<f64> {
        if let Some(value) = self.cache.get(&person_id) {
            return Ok(*value);
        }

        let parents = self.get_parents(person_id).await?;
        if parents.len() < 2 {
            self.cache.insert(person_id, 0.0);
            return Ok(0.0);
        }

        let father = parents[0];
        let mother = parents[1];
        let common_ancestors = self.find_common_ancestors(father, mother).await?;

        let mut coeff = 0.0;
        for ancestor in common_ancestors {
            let father_paths = self.find_paths(father, ancestor).await?;
            let mother_paths = self.find_paths(mother, ancestor).await?;

            for f_path in &father_paths {
                for m_path in &mother_paths {
                    let n = f_path.len() + m_path.len();
                    let ancestor_coeff = self.calculate(ancestor).await?;
                    coeff += (0.5_f64).powi((n as i32) + 1) * (1.0 + ancestor_coeff);
                }
            }
        }

        self.cache.insert(person_id, coeff);
        Ok(coeff)
    }

    async fn get_parents(&self, person_id: PersonId) -> Result<Vec<PersonId>> {
        let cypher = query(
            "MATCH (child:Person {id: $id})-[:CHILD_OF]->(parent:Person) RETURN parent.id as id ORDER BY id",
        )
        .param("id", person_id.0.to_string());

        let mut result = self.db.neo4j.execute(cypher).await?;
        let mut parents = Vec::new();
        while let Some(row) = result.next().await? {
            let id: String = row.get("id")?;
            parents.push(PersonId(Uuid::parse_str(&id)?));
        }
        Ok(parents)
    }

    async fn find_common_ancestors(
        &self,
        father: PersonId,
        mother: PersonId,
    ) -> Result<Vec<PersonId>> {
        let cypher = query(
            "MATCH (f:Person {id: $father})-[:CHILD_OF*1..]->(ancestor:Person),
                   (m:Person {id: $mother})-[:CHILD_OF*1..]->(ancestor)
             RETURN DISTINCT ancestor.id as id",
        )
        .param("father", father.0.to_string())
        .param("mother", mother.0.to_string());

        let mut result = self.db.neo4j.execute(cypher).await?;
        let mut ancestors = Vec::new();
        while let Some(row) = result.next().await? {
            let id: String = row.get("id")?;
            ancestors.push(PersonId(Uuid::parse_str(&id)?));
        }
        Ok(ancestors)
    }

    async fn find_paths(&self, from: PersonId, to: PersonId) -> Result<Vec<Vec<PersonId>>> {
        let cypher = query(
            "MATCH path = (start:Person {id: $from})-[:CHILD_OF*1..]->(end:Person {id: $to})
             RETURN [node in nodes(path) | node.id] as ids",
        )
        .param("from", from.0.to_string())
        .param("to", to.0.to_string());

        let mut result = self.db.neo4j.execute(cypher).await?;
        let mut paths = Vec::new();
        while let Some(row) = result.next().await? {
            let ids: Vec<String> = row.get("ids")?;
            let path: Vec<PersonId> = ids
                .into_iter()
                .map(|id| Uuid::parse_str(&id).map(PersonId))
                .collect::<Result<_, _>>()?;
            paths.push(path);
        }
        Ok(paths)
    }

    pub fn cache_len(&self) -> usize {
        self.cache.len()
    }

    pub fn clear_cache(&mut self) {
        self.cache.clear();
    }
}
