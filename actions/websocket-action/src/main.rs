mod auth;
mod data_types;
mod events;
mod flow_setting;
mod functions;
mod outbound;
mod route;
mod server;

use hercules::{Action, HerculesEvent, ScalingOption, Translation};
use tokio_stream::StreamExt;

use functions::Send;
use outbound::new_outbound_connections;

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

/// `WebsocketAuthType`/`WebsocketAuthValue`/`Websocket*Input` and the four
/// `Ws*RuntimeEvent`s never appear below. Attaching `#[hercules::data_type]`
/// / `#[hercules::runtime_event]` registered each of them automatically as
/// part of `Action::new` (see `hercules::registration`). `Send` is the one
/// exception: it needs the shared `outbound` connection map injected at
/// construction time, so it's registered by hand below instead (see its
/// `manual` attribute).
fn build_action(outbound: outbound::OutboundConnections) -> Action {
    let mut action = Action::new(
        env("HERCULES_ACTION_ID", "websocket-action"),
        env("HERCULES_SDK_VERSION", "0.0.0"),
    )
    .aquila_url(env("HERCULES_AQUILA_URL", "127.0.0.1:8081"))
    // Every instance needs to be reachable to accept WebSocket connections,
    // so every instance gets every flow rather than splitting them up
    // (mirrors rest-action).
    .scaling(ScalingOption::Disabled)
    .author("CodeZero")
    .icon("tabler:plug-connected")
    .documentation("A WebSocket server that lets flows react to incoming connections, messages, disconnects, and errors, and push messages back out.")
    .name([Translation::new("en-US", "WebSocket")]);

    action.register_runtime_function(Send::new(outbound));
    action
}

#[tokio::main]
async fn main() -> hercules::Result<()> {
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("websocket_action=info,hercules=info"),
    )
    .init();

    let outbound = new_outbound_connections();

    let mut args = std::env::args().skip(1);
    if args.next().as_deref() == Some("export") {
        let dir = args
            .next()
            .unwrap_or_else(|| "./out/draco-websocket".to_string());
        build_action(outbound)
            .export(&dir)
            .unwrap_or_else(|err| panic!("failed to export to {dir:?}: {err}"));
        println!("wrote module definitions to {dir}");
        return Ok(());
    }

    let action = build_action(outbound.clone());
    let mut events = action.subscribe();

    let aquila_url = env("HERCULES_AQUILA_URL", "127.0.0.1:8081");
    log::info!("connecting to Aquila at {aquila_url}");

    let connected = action
        .connect(env("HERCULES_AUTH_TOKEN", "value"), None)
        .await
        .unwrap_or_else(|err| panic!("failed to connect to Aquila: {err}"));

    let host = env("WEBSOCKET_SERVER_HOST", "0.0.0.0");
    let port = env("WEBSOCKET_SERVER_PORT", "8080");
    let addr = format!("{host}:{port}")
        .parse()
        .unwrap_or_else(|err| panic!("invalid WEBSOCKET_SERVER_HOST/WEBSOCKET_SERVER_PORT: {err}"));

    tokio::spawn(server::serve(addr, connected, outbound));

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
