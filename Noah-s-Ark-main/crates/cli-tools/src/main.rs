use anyhow::{Context, Result};
use database::DatabasePool;
use genealogy_types::{Person, PersonId, Sex};
use std::env;
use tokio::runtime::Runtime;
use uuid::Uuid;

fn main() -> Result<()> {
    let mut args = env::args().skip(1);
    match args.next().as_deref() {
        Some("ping-db") => Runtime::new()?.block_on(ping_db()),
        Some("seed-person") => {
            let first = args.next().unwrap_or_else(|| "John".into());
            let last = args.next().unwrap_or_else(|| "Doe".into());
            Runtime::new()?.block_on(seed_person(&first, &last))
        }
        _ => {
            println!("Utilisation : cli-tools <ping-db|seed-person>");
            Ok(())
        }
    }
}

async fn ping_db() -> Result<()> {
    let db = connect().await?;
    db.postgres
        .acquire()
        .await
        .context("Impossible de contacter PostgreSQL")?;
    println!("PostgreSQL OK");
    Ok(())
}

async fn seed_person(first_name: &str, surname: &str) -> Result<()> {
    let db = connect().await?;
    let repo = database::PersonRepository::new(db);
    let now = chrono::Utc::now().naive_utc();
    let person = Person {
        id: PersonId(Uuid::new_v4()),
        first_name: first_name.to_string(),
        surname: surname.to_string(),
        surname_prefix: None,
        nicknames: Vec::new(),
        sex: Sex::Unknown,
        birth: None,
        death: None,
        other_events: Vec::new(),
        occupation: Vec::new(),
        titles: Vec::new(),
        notes: None,
        sources: Vec::new(),
        images: Vec::new(),
        public: true,
        created_at: now,
        updated_at: now,
        updated_by: None,
    };

    repo.create(&person).await?;
    println!("Personne {} {} insérée", first_name, surname);
    Ok(())
}

async fn connect() -> Result<DatabasePool> {
    DatabasePool::new(
        &env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://localhost/geneweb".into()),
        &env::var("NEO4J_URL").unwrap_or_else(|_| "neo4j://localhost:7687".into()),
        &env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".into()),
    )
    .await
}
