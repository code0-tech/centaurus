mod auth;
mod content_type;
mod data_types;
mod events;
mod flow_setting;
mod functions;
mod input;
mod pending;
mod response;
mod route;
mod server;
mod validation;

use hercules::{Action, HerculesEvent, ScalingOption, Translation};
use tokio_stream::StreamExt;

use functions::Respond;
use pending::new_pending_responses;

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

/// `RestAuthType`/`RestAuthValue`/`RestAdapterInput` and `RestRuntimeEvent`
/// never appear below. Attaching `#[hercules::data_type]` /
/// `#[hercules::runtime_event]` registered each of them automatically as
/// part of `Action::new` (see `hercules::registration`). `Respond` is the
/// one exception: it needs the shared `pending` map injected at
/// construction time, so it's registered by hand below instead (see its
/// `manual` attribute).
fn build_action(pending: pending::PendingResponses) -> Action {
    let mut action = Action::new(
        env("HERCULES_ACTION_ID", "rest-action"),
        env("HERCULES_SDK_VERSION", "0.0.0"),
    )
    .aquila_url(env("HERCULES_AQUILA_URL", "127.0.0.1:8081"))
    // Every instance needs to be reachable to serve HTTP traffic, so every
    // instance gets every flow rather than splitting them up.
    .scaling(ScalingOption::Disabled)
    .author("code0-tech")
    .icon("tabler:world-www")
    .documentation("Webhook triggered by an incoming HTTP request.")
    .name([Translation::new("en-US", "Webhook")]);

    action.register_runtime_function(Respond::new(pending));
    action
}

#[tokio::main]
async fn main() -> hercules::Result<()> {
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("rest_action=info,hercules=info"),
    )
    .init();

    let pending = new_pending_responses();

    let mut args = std::env::args().skip(1);
    if args.next().as_deref() == Some("export") {
        let dir = args
            .next()
            .unwrap_or_else(|| "./out/draco-rest".to_string());
        build_action(pending)
            .export(&dir)
            .unwrap_or_else(|err| panic!("failed to export to {dir:?}: {err}"));
        println!("wrote module definitions to {dir}");
        return Ok(());
    }

    let action = build_action(pending.clone());
    let mut events = action.subscribe();

    let aquila_url = env("HERCULES_AQUILA_URL", "127.0.0.1:8081");
    log::info!("connecting to Aquila at {aquila_url}");

    let connected = action
        .connect(env("HERCULES_AUTH_TOKEN", "value"), None)
        .await
        .unwrap_or_else(|err| panic!("failed to connect to Aquila: {err}"));

    let host = env("HTTP_SERVER_HOST", "0.0.0.0");
    let port = env("HTTP_SERVER_PORT", "8080");
    let addr = format!("{host}:{port}")
        .parse()
        .unwrap_or_else(|err| panic!("invalid HTTP_SERVER_HOST/HTTP_SERVER_PORT: {err}"));

    let execution_timeout_secs: u64 = env("HERCULES_EXECUTION_TIMEOUT_SECS", "30")
        .parse()
        .unwrap_or_else(|err| panic!("invalid HERCULES_EXECUTION_TIMEOUT_SECS: {err}"));
    let execution_timeout = std::time::Duration::from_secs(execution_timeout_secs);

    tokio::spawn(server::serve(addr, connected, pending, execution_timeout));

    while let Some(event) = events.next().await {
        match event {
            HerculesEvent::Connected => log::info!("connected to Aquila"),
            HerculesEvent::Error(error) => panic!("Aquila stream error: {error}"),
            HerculesEvent::FlowUpserted(flow) => {
                log::info!("flow {} was created/updated", flow.flow_id);
            }
            HerculesEvent::FlowDeleted(flow_id) => {
                log::info!("flow {flow_id} was deleted");
            }
            _ => {}
        }
    }

    Ok(())
}
