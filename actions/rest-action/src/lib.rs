mod admission;
mod auth;
mod content_type;
mod data_types;
mod events;
mod flow_setting;
mod functions;
mod input;
mod limits;
mod metrics;
mod pending;
// `pub` so `benches/routing.rs` (a separate crate target) can build and
// exercise a `RouteRegistry` directly, without spinning up a real Aquila
// connection.
pub mod registry;
mod response;
pub mod route;
mod server;
// `pub` for the same reason as `registry`/`route` — `benches/routing.rs`
// benchmarks schema validation directly.
pub mod validation;

use std::sync::{Arc, RwLock};

use hercules_sdk::{Action, HerculesEvent, ScalingOption, Translation};
use tokio_stream::StreamExt;

use admission::Admission;
use functions::Respond;
use limits::BodyLimits;
use metrics::Metrics;
use pending::new_pending_responses;
use registry::RouteRegistry;

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

/// `RestAuthType`/`RestAuthValue`/`RestAdapterInput` and `RestRuntimeEvent`
/// never appear below. Attaching `#[hercules_sdk::data_type]` /
/// `#[hercules_sdk::runtime_event]` registered each of them automatically as
/// part of `Action::new` (see `hercules_sdk::registration`). `Respond` is the
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
    .author("CodeZero")
    .icon("tabler:world-www")
    .documentation("Webhook triggered by an incoming HTTP request.")
    .name([Translation::new("en-US", "Webhook")]);

    action.register_runtime_function(Respond::new(pending));
    action
}

/// Logs one aggregate line at `info` on a fixed interval instead of one line
/// per request (see `server.rs`, which moved per-request success/failure
/// logging to `debug`). Combines our own HTTP-facing counters with
/// `Connected::metrics()`'s view of the outbound Aquila queue.
async fn log_metrics_periodically(metrics: Arc<Metrics>, connected: hercules_sdk::Connected) {
    let interval_secs: u64 = env("HERCULES_REST_METRICS_LOG_INTERVAL_SECS", "30")
        .parse()
        .unwrap_or_else(|err| panic!("invalid HERCULES_REST_METRICS_LOG_INTERVAL_SECS: {err}"));
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(interval_secs));
    interval.tick().await; // first tick fires immediately; skip it

    loop {
        interval.tick().await;
        let snapshot = metrics.snapshot();
        let aquila = connected.metrics();
        log::info!(
            "requests total={} 2xx={} 4xx={} 5xx={} overload_503={} oversized_413={} aquila_queue_depth={}/{} aquila_queue_saturation_count={} aquila_pending_flow_executions={}",
            snapshot.total,
            snapshot.status_2xx,
            snapshot.status_4xx,
            snapshot.status_5xx,
            snapshot.overload_503,
            snapshot.oversized_413,
            aquila.queue_depth,
            aquila.queue_capacity,
            aquila.queue_saturation_count,
            aquila.pending_flow_executions,
        );
    }
}

pub async fn run() -> hercules_sdk::Result<()> {
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

    // Seeded once here from `Connected::flows()` (not per request — see
    // `registry.rs`), then kept current purely by `FlowUpserted`/
    // `FlowDeleted` events below. This is a safety net for flows Aquila
    // pushed down before this loop started reading from `events`; every one
    // of them also arrives as a `FlowUpserted` event (Aquila replays its
    // full flow snapshot as `ActionFlowUpdate` messages on connect), so
    // `upsert` reapplying them here is idempotent.
    let registry = RouteRegistry::from_flows(connected.flows().into_iter().map(Arc::new));
    let registry = Arc::new(RwLock::new(Arc::new(registry)));

    let admission = Admission::from_env();
    let limits = BodyLimits::from_env();
    let metrics = Arc::new(Metrics::default());

    tokio::spawn(log_metrics_periodically(
        Arc::clone(&metrics),
        connected.clone(),
    ));

    let state = server::ServerState {
        connected,
        pending,
        execution_timeout,
        registry: Arc::clone(&registry),
        admission,
        limits,
        metrics: Arc::clone(&metrics),
    };
    let server_handle = tokio::spawn(server::serve(addr, state));
    tokio::pin!(server_handle);

    loop {
        tokio::select! {
            result = &mut server_handle => {
                match result {
                    Ok(Ok(())) => panic!("HTTP server task exited unexpectedly"),
                    Ok(Err(err)) => panic!("HTTP server task failed: {err}"),
                    Err(err) => panic!("HTTP server task panicked: {err}"),
                }
            }
            event = events.next() => {
                let Some(event) = event else { break };
                match event {
                    HerculesEvent::Connected => log::info!("connected to Aquila"),
                    HerculesEvent::Error(error) => panic!("Aquila stream error: {error}"),
                    HerculesEvent::FlowUpserted(flow) => {
                        log::info!("flow {} was created/updated", flow.flow_id);
                        // Compile + rebuild (the expensive part) against a
                        // snapshot taken under a brief read lock, then swap
                        // the pointer in under the write lock — so HTTP
                        // readers are only ever blocked for a pointer
                        // assignment, never for however long compiling this
                        // flow's regex/schema and rebuilding the index
                        // takes. Safe because this event loop is the only
                        // writer (single-threaded, sequential), so there's
                        // no lost-update race to guard against here.
                        let current =
                            Arc::clone(&*registry.read().unwrap_or_else(|err| err.into_inner()));
                        let updated = Arc::new(current.upsert(flow));
                        *registry.write().unwrap_or_else(|err| err.into_inner()) = updated;
                    }
                    HerculesEvent::FlowDeleted(flow_id) => {
                        log::info!("flow {flow_id} was deleted");
                        let current =
                            Arc::clone(&*registry.read().unwrap_or_else(|err| err.into_inner()));
                        let updated = Arc::new(current.remove(flow_id));
                        *registry.write().unwrap_or_else(|err| err.into_inner()) = updated;
                    }
                    _ => {}
                }
            }
        }
    }

    Ok(())
}
