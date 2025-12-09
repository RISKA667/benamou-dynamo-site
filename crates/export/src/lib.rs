use anyhow::Result;
use genealogy_types::Person;

pub fn to_json(person: &Person) -> Result<String> {
    Ok(serde_json::to_string_pretty(person)?)
}

pub fn to_gedcom(person: &Person) -> Result<gedcom::GedcomRecord> {
    gedcom::export_person(person)
}
