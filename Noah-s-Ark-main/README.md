# Roglo.eu • Architecture GeneWeb Rust

Ce dépôt contient la refonte complète de GeneWeb en Rust. L'objectif est de proposer une pile moderne (API GraphQL + services spécialisés) capable d'alimenter un nouveau roglo.eu.

## 🧱 Organisation du workspace

Workspace Cargo (`Cargo.toml` racine) → 11 crates principales :

| Crate | Rôle |
| --- | --- |
| `genealogy-types` | Types métiers (personnes, familles, événements, permissions…). |
| `genealogy-core` | Algorithmes généalogiques (p. ex. calcul de consanguinité). |
| `sosa` | Utilitaires de numérotation Sosa-Stradonitz. |
| `database` | Accès PostgreSQL / Neo4j / Redis + dépôts. |
| `gedcom` | Pont GEDCOM ↔️ modèles métiers. |
| `server` | API publique (Axum + async-graphql) + endpoints REST. |
| `admin-portal` | Point d'entrée pour un futur panneau d’admin. |
| `cli-tools` | Utilitaires CLI (ping DB, seed de données). |
| `plugins` | Contrats du système de plugins. |
| `export` | Exports JSON/GEDCOM centralisés. |
| `utils` | Initialisation du tracing & helpers partagés. |

## 🗄️ Stockage & accès aux données

- **PostgreSQL** : tables `persons`, `families`, `events`, `sources`, etc. Exemple SQL dans `crates/database/migrations/001_initial_schema.sql` (à créer selon les besoins).  
- **Neo4j** : stockage des graphes de parenté (`PersonRepository::create_neo4j_node`).  
- **Redis** : cache objet simple (`person:{uuid}` avec TTL 1h).

`DatabasePool` ouvre et partage les trois connexions, tandis que `PersonRepository` gère transactions, invalidation du cache et synchronisation Neo4j.

## 🗄️ Migrations & SQLx

Pré-requis : un PostgreSQL accessible et `DATABASE_URL` configurée (`postgres://user:pass@hôte:5432/geneweb` par exemple).

```bash
sqlx database create
sqlx migrate run
# Génère les métadonnées offline (si vous en avez besoin)
SQLX_OFFLINE=true cargo sqlx prepare --workspace -- --all-targets
```

L’environnement actuel ne comporte pas de serveur PostgreSQL, les commandes ci-dessus retournent donc un `Connection refused`. Relance-les une fois ta base disponible pour appliquer `crates/database/migrations/001_initial_schema.sql` et produire `sqlx-data.json`.

## 🌐 Serveur HTTP / GraphQL

Crate `server` :

- Axum 0.8 + `tower-http` (CORS).  
- GraphQL via `async-graphql` 7.
- Résolveurs exposés : `person`, `searchPersons`, `ancestors`, `consanguinity`, `calculateRelationship`.
- Les types GraphQL (`PersonPayload`, `SexGql`, `RelationshipPayload`) encapsulent les entités métiers pour éviter de coupler `genealogy-types` à GraphQL.
- REST de compat’ : `GET /api/persons/:id`, `GET /api/search`.
- GET/POST `/api/graphql` acceptent les requêtes GraphQL standard, et `/playground` expose l’UI Playground intégrée.
- Mutations disponibles : `createPerson`, `updatePerson`, `setPersonPrivacy`, `createFamily`, `updateFamily`,
  `addFamilyChild`, `removeFamilyChild`, `setFamilyPrivacy`, `addFamilyEvent`.

L’exécutable boote sur `0.0.0.0:3000` et charge les pools via variables d’environnement `DATABASE_URL`, `NEO4J_URL`, `REDIS_URL`.

## 🎯 Intégration frontend GraphQL

- **Endpoint unique** : `https://<host>/api/graphql`, accessible en GET (query string) ou POST (payload JSON).  
- **Playground** : `https://<host>/playground` pour explorer le schéma et générer les requêtes côté product/dev.
- **CORS** : `CorsLayer::permissive()` autorise les applications Svelte/React locales sans configuration supplémentaire.

## 🖥️ Portail admin frontend

- Application React + TypeScript (Vite) dans `frontend/`.  
- `npm install && npm run dev` lance le serveur de dev (port 5173) avec proxy vers `localhost:3000`.  
- `npm run build` produit un bundle prêt à être servi par un CDN ou un reverse proxy simple.  
- Variable `VITE_GRAPHQL_URL` optionnelle pour cibler une API distante (défaut `/api/graphql`).  
- Fonctionnalités actuelles : recherche de personnes (`searchPersons`), affichage détaillé + ascendance + consanguinité, calcul de relation (`calculateRelationship`) et bascule de confidentialité (`setPersonPrivacy`).

### Exemple de requête (fetch)

```ts
async function loadPerson(personId: string) {
  const query = `
    query ($id: ID!) {
      person(id: $id) {
        id
        firstName
        surname
        public
      }
    }
  `;

  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { id: personId } }),
  });

  return (await res.json()).data.person;
}
```

### Exemple de mutation privacy

```graphql
mutation TogglePrivacy($id: ID!, $public: Boolean!) {
  setPersonPrivacy(id: $id, public: $public) {
    id
    public
  }
}
```

Les mêmes endpoints peuvent alimenter un client React Query/Apollo ou un kit Svelte ; aucune route supplémentaire n’est nécessaire côté frontend.

## ⚙️ Algorithmes

`genealogy-core` contient un calculateur de consanguinité compatible GeneWeb :

- Traversée Neo4j pour construire les chemins `CHILD_OF`.  
- Mise en cache des coefficients pour éviter les recalculs.  
- Récursion asynchrone sécurisée grâce à `async-recursion`.

La numérotation Sosa est isolée dans la crate `sosa` afin de rester réutilisable côté CLI, plugins ou batchs offline.

## 🧰 Outils complémentaires

- `cli-tools`: `ping-db` vérifie la connectivité, `seed-person` insère un exemple.  
- `plugins`: enregistreur minimal pour des plugins analytiques (retour JSON).  
- `export`: helpers JSON/GEDCOM partagés entre API, CLI et batchs.

## 🧩 Plugins

- Contrat `GenealogyPlugin` avec métadonnées (`name`, `version`, `capabilities`) et exécution par capacité (`PersonInsights`, `FamilyInsights`, `Export(label)`).
- `PluginInvocation::for_person` / `for_family` facilitent la création de contextes d’exécution.
- `PluginRegistry` expose `register`, `available` (pour afficher la marketplace) et `run(capability, invocation)` qui agrège les réponses enrichies de métadonnées.

Exemple minimal :

```rust
use plugins::{GenealogyPlugin, PluginCapability, PluginInvocation, PluginMetadata, PluginRegistry, PluginResult};

struct TitleScanner {
    meta: PluginMetadata,
}

impl GenealogyPlugin for TitleScanner {
    fn metadata(&self) -> &PluginMetadata {
        &self.meta
    }

    fn capabilities(&self) -> &[PluginCapability] {
        &[PluginCapability::PersonInsights]
    }

    fn run(&self, _: &PluginCapability, invocation: &PluginInvocation<'_>) -> anyhow::Result<PluginResult> {
        let titles = match invocation.scope {
            plugins::PluginScope::Person(person) => person.titles.len(),
            _ => 0,
        };
        Ok(PluginResult {
            result: serde_json::json!({ "title_count": titles }),
            warnings: vec![],
        })
    }
}

let mut registry = PluginRegistry::new();
registry.register(TitleScanner { meta: /* ... */ });
```

## 🚀 Stack technologique

- **Langage** : Rust (toolchain nightly 1.94+ requise pour `edition2024`).
- **Runtime async** : Tokio.
- **Base relationnelle** : PostgreSQL + SQLx.
- **Graphes** : Neo4j (`neo4rs`).
- **Cache** : Redis (`redis` + connection manager async).
- **API** : Axum, async-graphql, Tower HTTP, serde/serde_json.
- **Tracing** : `tracing` + `tracing-subscriber` (init dans `utils`).
- **CI** : GitHub Actions (`.github/workflows/ci.yml`) exécute `cargo +nightly check --future-incompat-report` + cache Cargo.

## ▶️ Vérifier / développer

```bash
# Utiliser la toolchain nightly installée dans l’environnement
cargo +nightly check

# Lancer l’API (variables par défaut dans le code)
cargo +nightly run -p server
```

Prochaines étapes possibles :
- Ajouter les migrations SQL effectives (`sqlx migrate`).
- Finaliser les resolvers GraphQL (mutations famille, privacy, etc.).
- Brancher un frontend moderne (Svelte/React) sur `/api/graphql`.
- Étendre le système de plugins (chargement dynamique, sandbox WASM).
- Surveiller les releases `redis` (≥1.0) et `sqlx` (≥0.8) pour basculer dès que Rust 2024 sera stabilisé.

## ⚠️ Compatibilité Rust 2024

`cargo +nightly check` signale actuellement des avertissements « future-incompatible » issus de `redis 0.24` et `sqlx-postgres 0.7`. Ces versions s’appuient encore sur des comportements de fallback (`never type`) qui deviendront des erreurs une fois l’édition 2024 stabilisée (prévue Rust 1.85+).  

Plan d’action :

1. Continuer à compiler avec `cargo +nightly check --future-incompat-report` pour surveiller l’état exact des dépendances.  
2. Préparer un bump vers `redis 1.0` et `sqlx 0.8` dès leur adoption officielle (elles embarquent déjà les correctifs 2024).  
3. Intégrer une CI (GitHub Actions) qui exécute `cargo +nightly check` + `cargo report future-incompatibilities` afin d’anticiper toute régression.
