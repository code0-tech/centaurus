mod data_types;
mod events;
mod schedule;

use hercules::{Action, HerculesEvent, ScalingOption, Translation};
use tokio_stream::StreamExt;

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

/// `CronMinute`/`CronHour`/... and `CronRuntimeEvent` never appear below —
/// attaching `#[hercules::data_type]` / `#[hercules::runtime_event]`
/// registered each of them automatically as part of `Action::new` (see
/// `hercules::registration`).
fn build_action() -> Action {
    Action::new(
        env("HERCULES_ACTION_ID", "cron-action"),
        env("HERCULES_SDK_VERSION", "0.0.0"),
    )
    .aquila_url(env("HERCULES_AQUILA_URL", "127.0.0.1:8081"))
    // Each flow's schedule only needs to be evaluated by one instance;
    // splitting avoids every instance firing the same flow independently.
    .scaling(ScalingOption::Split)
    .author("code0-tech")
    .icon("tabler:file-time")
    .documentation("Scheduled Flow using Cron-Jobs.")
    .name([Translation::new("en-US", "Cron")])
}

#[tokio::main]
async fn main() -> hercules::Result<()> {
    // Defaults to info-level logs for this action and the SDK even without
    // RUST_LOG set; override with e.g. RUST_LOG=hercules=debug,cron_action=debug.
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("cron_action=info,hercules=info"),
    )
    .init();

    let mut args = std::env::args().skip(1);
    if args.next().as_deref() == Some("export") {
        let dir = args
            .next()
            .unwrap_or_else(|| "./out/draco-cron".to_string());
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

    tokio::spawn(schedule::run(connected));

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
