mod server;
mod tools;

use hercules_sdk::{Action, ConfigurationDefinition, HerculesEvent, ScalingOption, Translation};
use tokio_stream::StreamExt;

use crate::tools::TOKEN_CONFIG_ID;

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

fn build_action() -> Action {
    Action::new(
        env("HERCULES_ACTION_ID", "mcp-action"),
        env("HERCULES_SDK_VERSION", "0.0.0"),
    )
    .aquila_url(env("HERCULES_AQUILA_URL", "127.0.0.1:8081"))
    // Every instance needs to be reachable to serve MCP traffic, so every
    // instance gets every flow rather than splitting them up.
    .scaling(ScalingOption::Disabled)
    .author("code0-tech")
    .icon("tabler:tool")
    .documentation("Exposes every flow connected to this action as an MCP tool.")
    .name([Translation::new("en-US", "MCP")])
    .configuration(
        ConfigurationDefinition::new(TOKEN_CONFIG_ID, "string")
            .name([Translation::new("en-US", "Token")])
            .description([Translation::new(
                "en-US",
                "Bearer token clients must send to call a tool. Leave empty to allow unauthenticated calls.",
            )])
            .optional(true),
    )
}

#[tokio::main]
async fn main() -> hercules_sdk::Result<()> {
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("mcp_action=info,hercules=info"),
    )
    .init();

    let mut args = std::env::args().skip(1);
    if args.next().as_deref() == Some("export") {
        let dir = args.next().unwrap_or_else(|| "./out/mcp-action".to_string());
        build_action()
            .export(&dir)
            .unwrap_or_else(|err| panic!("failed to export to {dir:?}: {err}"));
        println!("wrote module definitions to {dir}");
        return Ok(());
    }

    let action = build_action();
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

    tokio::spawn(server::serve(addr, connected));

    while let Some(event) = events.next().await {
        match event {
            HerculesEvent::Connected => log::info!("connected to Aquila"),
            HerculesEvent::Error(error) => panic!("Aquila stream error: {error}"),
            HerculesEvent::FlowUpserted(flow) => {
                log::info!("flow {} was created/updated, now exposed as a tool", flow.flow_id);
            }
            HerculesEvent::FlowDeleted(flow_id) => {
                log::info!("flow {flow_id} was deleted, no longer exposed as a tool");
            }
            _ => {}
        }
    }

    Ok(())
}
