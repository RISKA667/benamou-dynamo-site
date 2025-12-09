use anyhow::Result;
use genealogy_types::{Family, Person};
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Métadonnées déclaratives exposées par chaque plugin.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PluginMetadata {
    pub name: String,
    pub version: String,
    pub author: Option<String>,
    pub description: Option<String>,
    pub capabilities: Vec<PluginCapability>,
}

/// Capacités supportées par un plugin.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum PluginCapability {
    /// Analyse centrée sur une personne (scores, complétions...)
    PersonInsights,
    /// Analyse familiale (statuts, cohérence...)
    FamilyInsights,
    /// Export personnalisé identifié par un label
    Export(String),
}

/// Contexte dans lequel un plugin est exécuté (personne ou famille + config JSON).
#[derive(Debug)]
pub struct PluginInvocation<'a> {
    pub scope: PluginScope<'a>,
    pub config: Value,
}

impl<'a> PluginInvocation<'a> {
    pub fn for_person(person: &'a Person) -> Self {
        Self {
            scope: PluginScope::Person(person),
            config: Value::Null,
        }
    }

    pub fn for_family(family: &'a Family) -> Self {
        Self {
            scope: PluginScope::Family(family),
            config: Value::Null,
        }
    }

    pub fn with_config(mut self, config: Value) -> Self {
        self.config = config;
        self
    }
}

#[derive(Debug)]
pub enum PluginScope<'a> {
    Person(&'a Person),
    Family(&'a Family),
}

/// Résultat brut renvoyé par un plugin.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PluginResult {
    pub result: Value,
    pub warnings: Vec<String>,
}

/// Réponse normalisée fournie au runtime.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PluginResponse {
    pub plugin: PluginMetadata,
    pub capability: PluginCapability,
    pub result: Value,
    pub warnings: Vec<String>,
}

pub trait GenealogyPlugin: Send + Sync {
    fn metadata(&self) -> &PluginMetadata;
    fn capabilities(&self) -> &[PluginCapability];
    fn run(&self, capability: &PluginCapability, invocation: &PluginInvocation<'_>) -> Result<PluginResult>;
}

pub struct PluginRegistry {
    plugins: Vec<Box<dyn GenealogyPlugin>>, 
}

impl Default for PluginRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self { plugins: Vec::new() }
    }

    pub fn register<P: GenealogyPlugin + 'static>(&mut self, plugin: P) {
        self.plugins.push(Box::new(plugin));
    }

    /// Retourne les métadonnées de tous les plugins enregistrés.
    pub fn available(&self) -> Vec<PluginMetadata> {
        self.plugins
            .iter()
            .map(|plugin| plugin.metadata().clone())
            .collect()
    }

    /// Lance tous les plugins capables de traiter la capacité donnée.
    pub fn run(
        &self,
        capability: PluginCapability,
        invocation: PluginInvocation<'_>,
    ) -> Result<Vec<PluginResponse>> {
        let mut outputs = Vec::new();
        for plugin in &self.plugins {
            if plugin.capabilities().iter().any(|cap| cap == &capability) {
                let plugin_meta = plugin.metadata().clone();
                let plugin_result = plugin.run(&capability, &invocation)?;
                outputs.push(PluginResponse {
                    plugin: plugin_meta,
                    capability: capability.clone(),
                    result: plugin_result.result,
                    warnings: plugin_result.warnings,
                });
            }
        }
        Ok(outputs)
    }
}
