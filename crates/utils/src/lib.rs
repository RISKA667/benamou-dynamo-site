use anyhow::Result;
use tracing::Level;
use tracing_subscriber::{self, EnvFilter};

pub fn init_tracing(service_name: &str) -> Result<()> {
    if tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_target(false)
        .with_max_level(Level::INFO)
        .try_init()
        .is_err()
    {
        tracing::debug!("Tracing déjà initialisé");
    }
    tracing::info!("service = {}", service_name);
    Ok(())
}
