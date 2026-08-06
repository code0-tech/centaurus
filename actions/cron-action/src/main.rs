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
    // RUST_LOG=hercules=debug,cron_action=debug cargo run
    env_logger::init();

    let action = build_action();
    let mut events = action.subscribe();

    let connected = action
        .connect(env("HERCULES_AUTH_TOKEN", "token"), None)
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
