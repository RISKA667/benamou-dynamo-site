use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Identifiant unique d'une personne
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PersonId(pub Uuid);

/// Identifiant unique d'une famille
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct FamilyId(pub Uuid);

/// Sexe d'une personne
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Sex {
    Male,
    Female,
    Unknown,
}

/// Date avec différents niveaux de précision
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PreciseDate {
    Exact(NaiveDate),
    About(NaiveDate),
    Before(NaiveDate),
    After(NaiveDate),
    Between(NaiveDate, NaiveDate),
    YearOnly(i32),
    Unknown,
}

/// Lieu géographique
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Place {
    pub name: String,
    pub locality: Option<String>,
    pub city: Option<String>,
    pub county: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

/// Source d'information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Source {
    pub id: Uuid,
    pub title: String,
    pub author: Option<String>,
    pub publication_info: Option<String>,
    pub repository: Option<String>,
    pub notes: Option<String>,
}

/// Événement de vie
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifeEvent {
    pub event_type: EventType,
    pub date: PreciseDate,
    pub place: Option<Place>,
    pub witnesses: Vec<PersonId>,
    pub notes: Option<String>,
    pub sources: Vec<Source>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    Birth,
    Baptism,
    Death,
    Burial,
    Marriage,
    Divorce,
    Engagement,
    Custom(String),
}

/// Titre nobiliaire ou honorifique
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Title {
    pub name: String,
    pub place: Option<String>,
    pub date_start: Option<PreciseDate>,
    pub date_end: Option<PreciseDate>,
    pub nth: Option<u32>,
}

/// Référence à une image
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageReference {
    pub url: String,
    pub description: Option<String>,
    pub is_primary: bool,
}

/// ID d'un wizard (administrateur de base)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WizardId(pub Uuid);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wizard {
    pub id: WizardId,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub is_admin: bool,
    pub permissions: Vec<Permission>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Permission {
    ReadAll,
    WriteOwn,
    WriteAll,
    DeleteOwn,
    DeleteAll,
    ManageWizards,
}

/// Personne complète
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Person {
    pub id: PersonId,
    pub first_name: String,
    pub surname: String,
    pub surname_prefix: Option<String>,
    pub nicknames: Vec<String>,
    pub sex: Sex,
    pub birth: Option<LifeEvent>,
    pub death: Option<LifeEvent>,
    pub other_events: Vec<LifeEvent>,
    pub occupation: Vec<String>,
    pub titles: Vec<Title>,
    pub notes: Option<String>,
    pub sources: Vec<Source>,
    pub images: Vec<ImageReference>,
    pub public: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub updated_by: Option<WizardId>,
}

/// Famille
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Family {
    pub id: FamilyId,
    pub father: Option<PersonId>,
    pub mother: Option<PersonId>,
    pub children: Vec<PersonId>,
    pub marriage: Option<LifeEvent>,
    pub divorce: Option<LifeEvent>,
    pub other_events: Vec<LifeEvent>,
    pub notes: Option<String>,
    pub sources: Vec<Source>,
    pub public: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
