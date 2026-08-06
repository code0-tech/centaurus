//! Ticks once a minute and, for each of this action's flows whose cron
//! settings match the current minute, asks Aquila to execute it.

use std::str::FromStr;

use chrono::{DateTime, Datelike, Timelike, Utc};
use cron::Schedule;
use hercules::wire::ActionFlow;
use hercules::Connected;
use tucana::shared::value::Kind;

const TICK_EXPRESSION: &str = "0 * * * * *";

pub async fn run(connected: Connected) {
    let tick_schedule = Schedule::from_str(TICK_EXPRESSION).expect("TICK_EXPRESSION is valid");

    loop {
        let now = Utc::now();
        let Some(next) = tick_schedule.upcoming(Utc).take(1).next() else {
            log::error!("no upcoming cron tick; stopping the scheduler");
            return;
        };
        if let Ok(until_next) = (next - now).to_std() {
            tokio::time::sleep(until_next).await;
        }

        let flows = connected.flows();
        log::debug!("tick at {next}: checking {} flow(s)", flows.len());

        for flow in flows {
            if !matches_schedule(&flow, next) {
                continue;
            }

            log::info!("flow {} matches schedule {next}, executing", flow.flow_id);
            let connected = connected.clone();
            let flow_id = flow.flow_id.to_string();
            tokio::spawn(async move {
                if let Err(err) = connected
                    .execute_flow(flow_id.clone(), serde_json::Value::Null)
                    .await
                {
                    log::error!("failed to execute flow {flow_id}: {err}");
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
    let Some(minute) = setting(flow, "cronMinute") else {
        return false;
    };
    let Some(hour) = setting(flow, "cronHour") else {
        return false;
    };
    let Some(dom) = setting(flow, "cronDayOfMonth") else {
        return false;
    };
    let Some(month) = setting(flow, "cronMonth") else {
        return false;
    };
    let Some(dow) = setting(flow, "cronDayOfWeek") else {
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

    now.year() == next.year()
        && now.month() == next.month()
        && now.day() == next.day()
        && now.hour() == next.hour()
        && now.minute() == next.minute()
}
