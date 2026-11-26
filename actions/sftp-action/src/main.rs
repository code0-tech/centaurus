mod client;
mod config;
mod data_types;
mod functions;

use hercules_sdk::{Action, ConfigurationDefinition, HerculesEvent, ScalingOption, Translation};
use tokio_stream::StreamExt;

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

/// The `SftpEntry` data type and the `ReadFile`/`WriteFile`/`DeleteFile`/
/// `ListDirectory` functions never appear below — attaching
/// `#[hercules_sdk::data_type]` / `#[hercules_sdk::runtime_function]`
/// registered each of them automatically as part of `Action::new` (see
/// `hercules_sdk::registration`). Once connected, the SDK routes incoming
/// function executions to the matching handler, so there's nothing to wire up
/// by hand here.
fn build_action() -> Action {
    Action::new(
        env("HERCULES_ACTION_ID", "sftp-action"),
        env("HERCULES_SDK_VERSION", "0.0.0"),
    )
    .aquila_url(env("HERCULES_AQUILA_URL", "127.0.0.1:8081"))
    // Functions are stateless and connect per call, so any instance can serve
    // any flow; leave scaling at the default rather than splitting flows up.
    .scaling(ScalingOption::Disabled)
    .author("CodeZero")
    .icon("tabler:folder-share")
    .documentation("Read, write, delete and list files on a remote SFTP server.")
    .name([Translation::new("en-US", "SFTP")])
    .configuration(
        ConfigurationDefinition::new(config::HOST, "string")
            .name([Translation::new("en-US", "Host")])
            .description([Translation::new(
                "en-US",
                "Hostname or IP address of the SFTP server.",
            )]),
    )
    .configuration(
        ConfigurationDefinition::new(config::PORT, "string")
            .name([Translation::new("en-US", "Port")])
            .description([Translation::new(
                "en-US",
                "Port the SFTP server listens on. Defaults to 22 when left empty.",
            )])
            .optional(true),
    )
    .configuration(
        ConfigurationDefinition::new(config::USERNAME, "string")
            .name([Translation::new("en-US", "Username")])
            .description([Translation::new("en-US", "Username to authenticate with.")]),
    )
    .configuration(
        ConfigurationDefinition::new(config::PASSWORD, "string")
            .name([Translation::new("en-US", "Password")])
            .description([Translation::new("en-US", "Password to authenticate with.")])
            .hidden(true)
            .optional(true),
    )
}

#[tokio::main]
async fn main() -> hercules_sdk::Result<()> {
    // Defaults to info-level logs for this action and the SDK even without
    // RUST_LOG set; override with e.g. RUST_LOG=hercules=debug,sftp_action=debug.
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("sftp_action=info,hercules=info"),
    )
    .init();

    let mut args = std::env::args().skip(1);
    if args.next().as_deref() == Some("export") {
        let dir = args
            .next()
            .unwrap_or_else(|| "./out/sftp-action".to_string());
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

    // Held for the lifetime of the process (hence the leading underscore):
    // the SDK dispatches incoming function executions in the background off
    // this connection, so dropping it would stop serving `sftp::*` calls.
    let _connected = action
        .connect(env("HERCULES_AUTH_TOKEN", "value"), None)
        .await
        .unwrap_or_else(|err| panic!("failed to connect to Aquila: {err}"));

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
