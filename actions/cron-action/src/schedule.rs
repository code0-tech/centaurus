//! Ticks once a minute and, for each of this action's flows whose cron
//! settings match the current minute, asks Aquila to execute it.

use std::str::FromStr;

use chrono::{DateTime, Datelike, Timelike, Utc};
use cron::Schedule;
use hercules_sdk::Connected;
use hercules_sdk::wire::ActionFlow;
use tucana::shared::value::Kind;

const TICK_EXPRESSION: &str = "0 * * * * *";

pub async fn run(connected: Connected) {
    let tick_schedule = Schedule::from_str(TICK_EXPRESSION).expect("TICK_EXPRESSION is valid");

    // Build the iterator once: each `next()` advances strictly past the
    // previous tick. Re-creating it every iteration anchors it to `Utc::now()`,
    // and since `tokio::time::sleep` can wake a hair before the wall-clock
    // target, the same tick gets selected twice and the flow runs twice.
    let mut ticks = tick_schedule.upcoming(Utc);

    loop {
        let Some(next) = ticks.next() else {
            log::error!("no upcoming cron tick; stopping the scheduler");
            return;
        };
        if let Ok(until_next) = (next - Utc::now()).to_std() {
            tokio::time::sleep(until_next).await;
        }

        let flows = connected.flows();
        log::info!("tick at {next}: checking {} flow(s)", flows.len());

        for flow in flows {
            if !matches_schedule(&flow, next) {
                continue;
            }

            log::info!("flow {} matches schedule {next}, executing", flow.flow_id);
            let connected = connected.clone();
            let flow_id = flow.flow_id.to_string();
            tokio::spawn(async move {
                match connected
                    .execute_flow(flow_id.clone(), serde_json::Value::Null)
                    .await
                {
                    Ok(result) => log::info!("flow {flow_id} executed successfully: {result:?}"),
                    Err(err) => log::error!("failed to execute flow {flow_id}: {err}"),
                }
            });
        }
    }
}

fn setting(flow: &ActionFlow, id: &str) -> Option<String> {
    flow.settings
        .iter()
        .find(|s| s.flow_setting_id == id)
        .and_then(|s| s.value.as_ref())
        .and_then(|v| v.kind.as_ref())
        .and_then(|k| match k {
            Kind::StringValue(s) => Some(s.clone()),
            _ => None,
        })
}

fn matches_schedule(flow: &ActionFlow, now: DateTime<Utc>) -> bool {
    let Some(minute) = setting(flow, "cron_minute") else {
        log::warn!("flow {} is missing the cron_minute setting", flow.flow_id);
        return false;
    };
    let Some(hour) = setting(flow, "cron_hour") else {
        log::warn!("flow {} is missing the cron_hour setting", flow.flow_id);
        return false;
    };
    let Some(dom) = setting(flow, "cron_day_of_month") else {
        log::warn!(
            "flow {} is missing the cron_day_of_month setting",
            flow.flow_id
        );
        return false;
    };
    let Some(month) = setting(flow, "cron_month") else {
        log::warn!("flow {} is missing the cron_month setting", flow.flow_id);
        return false;
    };
    let Some(dow) = setting(flow, "cron_day_of_week") else {
        log::warn!(
            "flow {} is missing the cron_day_of_week setting",
            flow.flow_id
        );
        return false;
    };

    let expression = format!("* {minute} {hour} {dom} {month} {dow}");
    let schedule = match Schedule::from_str(&expression) {
        Ok(schedule) => schedule,
        Err(err) => {
            log::error!(
                "flow {} has an invalid cron expression {expression:?}: {err}",
                flow.flow_id
            );
            return false;
        }
    };
    let Some(next) = schedule.upcoming(Utc).next() else {
        return false;
    };

    let matches = now.year() == next.year()
        && now.month() == next.month()
        && now.day() == next.day()
        && now.hour() == next.hour()
        && now.minute() == next.minute();

    log::debug!(
        "flow {} expression {expression:?} next run {next}, matches {now}: {matches}",
        flow.flow_id
    );

    matches
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The scheduler woke a hair early (e.g. tokio's monotonic timer firing
    /// just before the wall clock crosses the boundary), so `now` is still a
    /// few hundred microseconds *before* the tick it just slept for.
    fn now_just_before(tick: DateTime<Utc>) -> DateTime<Utc> {
        tick - chrono::Duration::microseconds(500)
    }

    /// Reproduces the duplicate: re-deriving `upcoming`/`after` from an
    /// early `now` every loop iteration re-selects the SAME tick, so the flow
    /// fires twice for one minute.
    #[test]
    fn rederiving_from_early_now_repeats_the_tick() {
        let schedule = Schedule::from_str(TICK_EXPRESSION).unwrap();

        let first = schedule.upcoming(Utc).next().unwrap();
        // Loop body wakes just before `first`, then rebuilds the iterator.
        let now = now_just_before(first);
        let second = schedule.after(&now).next().unwrap();

        assert_eq!(first, second, "old behavior selects the same tick twice");
    }

    /// The fix: a single long-lived iterator advances strictly past the last
    /// tick, so an early wakeup cannot re-select it.
    #[test]
    fn persistent_iterator_never_repeats_a_tick() {
        let schedule = Schedule::from_str(TICK_EXPRESSION).unwrap();
        let mut ticks = schedule.upcoming(Utc);

        let mut prev = ticks.next().unwrap();
        for _ in 0..5 {
            // Even if we "wake early" relative to the tick we're about to
            // process, the next pull is strictly later.
            let _woke_early = now_just_before(prev);
            let next = ticks.next().unwrap();
            assert!(next > prev, "tick {next} must advance past {prev}");
            assert_eq!((next - prev), chrono::Duration::minutes(1));
            prev = next;
        }
    }
}
