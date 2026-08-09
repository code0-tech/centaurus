//! Matches an incoming WebSocket connection/message against this action's
//! flows. Path pattern compilation is ported from rest-action's
//! `route.rs` (same `:param`/`*`/legacy-regex syntax); what's different here
//! is that there are four distinct trigger kinds sharing the same path
//! syntax, so there are four `find_matching_*_flows` entry points below, one
//! per `flow_setting_id` used to both scope a flow to a path *and* tell
//! which of the four `WEBSOCKET_*` events it was defined against (see the
//! module doc on `events.rs`).

use std::collections::HashMap;
use tucana::aquila::ActionFlow;

use crate::flow_setting;

pub const CONNECT_PATH_SETTING: &str = "ws_connect_path";
pub const MESSAGE_PATH_SETTING: &str = "ws_message_path";
pub const DISCONNECT_PATH_SETTING: &str = "ws_disconnect_path";
pub const ERROR_PATH_SETTING: &str = "ws_error_path";

pub fn find_matching_connect_flows(flows: &[ActionFlow], path: &str) -> Vec<ActionFlow> {
    find_matching_flows(flows, CONNECT_PATH_SETTING, path)
}

pub fn find_matching_message_flows(flows: &[ActionFlow], path: &str) -> Vec<ActionFlow> {
    find_matching_flows(flows, MESSAGE_PATH_SETTING, path)
}

pub fn find_matching_disconnect_flows(flows: &[ActionFlow], path: &str) -> Vec<ActionFlow> {
    find_matching_flows(flows, DISCONNECT_PATH_SETTING, path)
}

pub fn find_matching_error_flows(flows: &[ActionFlow], path: &str) -> Vec<ActionFlow> {
    find_matching_flows(flows, ERROR_PATH_SETTING, path)
}

/// `true` if any flow is configured (on any of the four events) to accept
/// connections on `path` — used to decide whether to accept the WebSocket
/// handshake at all before firing any flow.
pub fn any_flow_matches_path(flows: &[ActionFlow], path: &str) -> bool {
    !find_matching_connect_flows(flows, path).is_empty()
        || !find_matching_message_flows(flows, path).is_empty()
        || !find_matching_disconnect_flows(flows, path).is_empty()
        || !find_matching_error_flows(flows, path).is_empty()
}

pub const CLIENT_CONNECT_URL_SETTING: &str = "ws_client_connect_url";
pub const CLIENT_MESSAGE_URL_SETTING: &str = "ws_client_message_url";
pub const CLIENT_DISCONNECT_URL_SETTING: &str = "ws_client_disconnect_url";
pub const CLIENT_ERROR_URL_SETTING: &str = "ws_client_error_url";

/// Client-mode matching (`client.rs`): unlike the inbound side, a client
/// connection isn't reached by an inbound path, so there's no pattern to
/// compile — the target URL is matched literally, scoped to the connecting
/// flow's project (two different projects independently targeting the same
/// external URL shouldn't see each other's events).
pub fn find_matching_client_connect_flows(
    flows: &[ActionFlow],
    project_slug: &str,
    url: &str,
) -> Vec<ActionFlow> {
    find_matching_client_flows(flows, CLIENT_CONNECT_URL_SETTING, project_slug, url)
}

pub fn find_matching_client_message_flows(
    flows: &[ActionFlow],
    project_slug: &str,
    url: &str,
) -> Vec<ActionFlow> {
    find_matching_client_flows(flows, CLIENT_MESSAGE_URL_SETTING, project_slug, url)
}

pub fn find_matching_client_disconnect_flows(
    flows: &[ActionFlow],
    project_slug: &str,
    url: &str,
) -> Vec<ActionFlow> {
    find_matching_client_flows(flows, CLIENT_DISCONNECT_URL_SETTING, project_slug, url)
}

pub fn find_matching_client_error_flows(
    flows: &[ActionFlow],
    project_slug: &str,
    url: &str,
) -> Vec<ActionFlow> {
    find_matching_client_flows(flows, CLIENT_ERROR_URL_SETTING, project_slug, url)
}

fn find_matching_client_flows(
    flows: &[ActionFlow],
    url_setting_id: &str,
    project_slug: &str,
    url: &str,
) -> Vec<ActionFlow> {
    flows
        .iter()
        .filter(|flow| {
            flow.project_slug == project_slug
                && flow_setting::as_string(flow, url_setting_id) == Some(url)
        })
        .cloned()
        .collect()
}

/// Reads back the named `:param` captures for `path` against whichever of
/// `flow`'s path settings (`path_setting_id`) matched it — used to populate
/// a data type's `path_params` field, mirroring rest-action's
/// `extract_path_params`.
pub fn extract_path_params(
    flow: &ActionFlow,
    path_setting_id: &str,
    path: &str,
) -> HashMap<String, String> {
    let Some(flow_ws_path) = flow_setting::as_string(flow, path_setting_id) else {
        return HashMap::new();
    };

    extract_named_route_captures(&flow_route_pattern(flow, flow_ws_path), path)
}

fn extract_named_route_captures(pattern: &str, route: &str) -> HashMap<String, String> {
    let Ok(anchored_pattern) = compile_route_pattern(pattern) else {
        return HashMap::new();
    };
    let Ok(regex) = regex::Regex::new(&anchored_pattern) else {
        return HashMap::new();
    };

    let Some(captures) = regex.captures(route) else {
        return HashMap::new();
    };

    regex
        .capture_names()
        .flatten()
        .filter_map(|name| {
            captures.name(name).map(|value| {
                (
                    name.to_string(),
                    percent_encoding::percent_decode_str(value.as_str())
                        .decode_utf8_lossy()
                        .into_owned(),
                )
            })
        })
        .collect()
}

fn find_matching_flows(
    flows: &[ActionFlow],
    path_setting_id: &str,
    path: &str,
) -> Vec<ActionFlow> {
    flows
        .iter()
        .filter(|flow| matches_request(flow, path_setting_id, path))
        .cloned()
        .collect()
}

fn matches_request(flow: &ActionFlow, path_setting_id: &str, path: &str) -> bool {
    // A flow only carries the settings for the one event it was defined
    // against, so the presence of `path_setting_id` on this flow is what
    // scopes matching to the right event kind (see events.rs's module doc).
    let Some(flow_ws_path) = flow_setting::as_string(flow, path_setting_id) else {
        return false;
    };

    let pattern = flow_route_pattern(flow, flow_ws_path);
    let is_match = matches_route_pattern(&pattern, path);
    log::debug!(
        "route check: flow_id={} setting={} pattern={:?} path={:?} matched={}",
        flow.flow_id,
        path_setting_id,
        pattern,
        path,
        is_match
    );
    is_match
}

fn flow_route_pattern(flow: &ActionFlow, flow_ws_path: &str) -> String {
    format!("/{}{}", flow.project_slug, flow_ws_path)
}

fn matches_route_pattern(pattern: &str, route: &str) -> bool {
    let Ok(anchored_pattern) = compile_route_pattern(pattern) else {
        return false;
    };
    let Ok(regex) = regex::Regex::new(&anchored_pattern) else {
        return false;
    };
    regex.is_match(route)
}

fn compile_route_pattern(pattern: &str) -> Result<String, String> {
    if is_url_pattern_style(pattern) {
        return compile_url_pattern_path(pattern).map(|pattern| format!("^{}$", pattern));
    }
    Ok(format!("^{}$", pattern))
}

fn is_url_pattern_style(pattern: &str) -> bool {
    let bytes = pattern.as_bytes();
    bytes.iter().enumerate().any(|(index, byte)| {
        (*byte == b':'
            && bytes
                .get(index + 1)
                .is_some_and(|next| next.is_ascii_alphabetic() || *next == b'_'))
            || (*byte == b'*' && bytes.get(index.wrapping_sub(1)) != Some(&b'.'))
    })
}

fn compile_url_pattern_path(pattern: &str) -> Result<String, String> {
    let mut compiled = String::new();
    let chars: Vec<char> = pattern.chars().collect();
    let mut index = 0;

    while index < chars.len() {
        match chars[index] {
            ':' if is_param_start(chars.get(index + 1).copied()) => {
                let (name, next_index) = read_param_name(&chars, index + 1);
                index = next_index;

                let (capture_pattern, next_index) = if chars.get(index) == Some(&'(') {
                    read_balanced_group(&chars, index)?
                } else {
                    (String::from("[^/]+"), index)
                };

                compiled.push_str(&format!("(?P<{name}>{capture_pattern})"));
                index = next_index;
            }
            '*' => {
                compiled.push_str(".*");
                index += 1;
            }
            value => {
                compiled.push_str(&regex::escape(&value.to_string()));
                index += 1;
            }
        }
    }

    Ok(compiled)
}

fn is_param_start(value: Option<char>) -> bool {
    value.is_some_and(|value| value.is_ascii_alphabetic() || value == '_')
}

fn read_param_name(chars: &[char], start: usize) -> (String, usize) {
    let mut index = start;
    let mut name = String::new();

    while let Some(value) = chars.get(index) {
        if value.is_ascii_alphanumeric() || *value == '_' {
            name.push(*value);
            index += 1;
        } else {
            break;
        }
    }

    (name, index)
}

fn read_balanced_group(chars: &[char], start: usize) -> Result<(String, usize), String> {
    let mut depth = 0;
    let mut index = start;
    let mut pattern = String::new();

    while let Some(value) = chars.get(index) {
        match value {
            '(' => {
                depth += 1;
                if depth > 1 {
                    pattern.push(*value);
                }
            }
            ')' => {
                depth -= 1;
                if depth == 0 {
                    return Ok((pattern, index + 1));
                }
                pattern.push(*value);
            }
            _ => pattern.push(*value),
        }
        index += 1;
    }

    Err(String::from("unclosed parameter regex group"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tucana::aquila::ActionFlow;
    use tucana::shared::{FlowSetting, Value, value::Kind};

    fn flow_with_setting(id: &str, setting_id: &str, path: &str) -> ActionFlow {
        ActionFlow {
            flow_id: id.parse().unwrap_or(1),
            project_slug: "acme".to_string(),
            settings: vec![FlowSetting {
                flow_setting_id: setting_id.to_string(),
                value: Some(Value {
                    kind: Some(Kind::StringValue(path.to_string())),
                }),
                ..Default::default()
            }],
            ..Default::default()
        }
    }

    #[test]
    fn matches_only_the_requested_event_kind() {
        let flows = vec![
            flow_with_setting("1", CONNECT_PATH_SETTING, "/chat"),
            flow_with_setting("2", MESSAGE_PATH_SETTING, "/chat"),
        ];

        assert_eq!(
            find_matching_connect_flows(&flows, "/acme/chat").len(),
            1
        );
        assert_eq!(
            find_matching_message_flows(&flows, "/acme/chat").len(),
            1
        );
        assert_eq!(find_matching_disconnect_flows(&flows, "/acme/chat").len(), 0);
    }

    #[test]
    fn dynamic_route_params_match_path_segments() {
        let flows = vec![flow_with_setting("1", MESSAGE_PATH_SETTING, "/rooms/:id")];
        assert_eq!(
            find_matching_message_flows(&flows, "/acme/rooms/42").len(),
            1
        );
        assert_eq!(
            find_matching_message_flows(&flows, "/acme/rooms/42/extra").len(),
            0
        );
    }
}
