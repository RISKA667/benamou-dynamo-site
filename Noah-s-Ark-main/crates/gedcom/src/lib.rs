use anyhow::{anyhow, Result};
use genealogy_types::Person;
use serde::{Deserialize, Serialize};

/// Représentation intermédiaire simplifiée d'une fiche GEDCOM.
#[derive(Debug, Serialize, Deserialize)]
pub struct GedcomRecord {
    pub name: String,
    pub payload: serde_json::Value,
}

pub fn export_person(person: &Person) -> Result<GedcomRecord> {
    Ok(GedcomRecord {
        name: format!("{} /{}/", person.first_name, person.surname),
        payload: serde_json::to_value(person)?,
    })
}

pub fn import_person(record: &GedcomRecord) -> Result<Person> {
    serde_json::from_value(record.payload.clone()).map_err(|err| anyhow!(err))
}
