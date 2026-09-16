//! Reads a typed value out of an `ActionFlow`'s settings by identifier.
//! Ported from rest-action's `flow_setting.rs`.

use tucana::aquila::ActionFlow;
use tucana::shared::{Struct, Value, value::Kind};

pub fn value<'a>(flow: &'a ActionFlow, flow_setting_id: &str) -> Option<&'a Value> {
    flow.settings
        .iter()
        .find(|setting| setting.flow_setting_id == flow_setting_id)
        .and_then(|setting| setting.value.as_ref())
}

pub fn as_string<'a>(flow: &'a ActionFlow, flow_setting_id: &str) -> Option<&'a str> {
    match value(flow, flow_setting_id)?.kind.as_ref()? {
        Kind::StringValue(value) => Some(value.as_str()),
        _ => None,
    }
}

#[allow(dead_code)]
pub fn as_struct<'a>(flow: &'a ActionFlow, flow_setting_id: &str) -> Option<&'a Struct> {
    match value(flow, flow_setting_id)?.kind.as_ref()? {
        Kind::StructValue(value) => Some(value),
        _ => None,
    }
}
