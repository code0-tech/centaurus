//! Matches an incoming HTTP request against this action's flows, and reads
//! path parameters back out of a match. Ported from draco's route matcher;
//! ownership of "which flow does this request belong to" moves from a
//! NATS-KV scan (`AdapterStore::get_possible_flow_match`) to a plain filter
//! over `Connected::flows()`.

use std::collections::HashMap;
use tucana::aquila::ActionFlow;

use crate::flow_setting;

pub fn find_matching_flow(
    flows: &[ActionFlow],
    method: &hyper::Method,
    path: &str,
) -> Option<ActionFlow> {
    flows
        .iter()
        .find(|flow| matches_request(flow, method, path))
        .cloned()
}

fn matches_request(flow: &ActionFlow, method: &hyper::Method, path: &str) -> bool {
    let Some(flow_method) = flow_setting::as_string(flow, "http_method") else {
        log::debug!(
            "route reject: flow_id={} reason=missing_or_invalid_http_method",
            flow.flow_id
        );
        return false;
    };

    if !flow_method.eq_ignore_ascii_case(method.as_str()) {
        return false;
    }

    let Some(flow_http_url) = flow_setting::as_string(flow, "http_url") else {
        log::debug!(
            "route reject: flow_id={} reason=missing_or_invalid_http_url",
            flow.flow_id
        );
        return false;
    };

    let pattern = flow_route_pattern(flow, flow_http_url);
    let is_match = matches_route_pattern(&pattern, path);
    log::debug!(
        "route check: flow_id={} pattern={:?} path={:?} matched={}",
        flow.flow_id,
        pattern,
        path,
        is_match
    );
    is_match
}

pub fn extract_path_params(flow: &ActionFlow, path: &str) -> HashMap<String, String> {
    let Some(flow_http_url) = flow_setting::as_string(flow, "http_url") else {
        return HashMap::new();
    };

    extract_named_route_captures(&flow_route_pattern(flow, flow_http_url), path)
}

fn flow_route_pattern(flow: &ActionFlow, flow_http_url: &str) -> String {
    format!("/{}{}", flow.project_slug, flow_http_url)
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
    use super::{compile_route_pattern, extract_named_route_captures, matches_route_pattern};

    #[test]
    fn exact_literal_match_works() {
        assert!(matches_route_pattern("test2", "test2"));
    }

    #[test]
    fn substring_match_is_rejected() {
        assert!(!matches_route_pattern("test", "test2"));
    }

    #[test]
    fn dynamic_route_params_match_path_segments() {
        assert!(matches_route_pattern(
            "/project/users/:id",
            "/project/users/42"
        ));
        assert!(!matches_route_pattern(
            "/project/users/:id",
            "/project/users/42/orders"
        ));
    }

    #[test]
    fn dynamic_route_params_are_returned_as_path_params() {
        let params = extract_named_route_captures(
            "/project/books/:category/:id",
            "/project/books/classics/12345",
        );

        assert_eq!(params.get("category").map(String::as_str), Some("classics"));
        assert_eq!(params.get("id").map(String::as_str), Some("12345"));
    }

    #[test]
    fn dynamic_route_wildcards_match_remaining_path() {
        assert!(matches_route_pattern(
            "/project/assets/*",
            "/project/assets/images/profile.jpg"
        ));
    }

    #[test]
    fn legacy_regex_patterns_still_work() {
        assert_eq!(
            compile_route_pattern("/project/users/(?P<user_id>[^/]+)").unwrap(),
            "^/project/users/(?P<user_id>[^/]+)$"
        );
        assert!(matches_route_pattern(
            "/project/users/(?P<user_id>[^/]+)",
            "/project/users/42"
        ));
    }

    #[test]
    fn invalid_regex_returns_false() {
        assert!(!matches_route_pattern("(", "/test"));
    }

    #[test]
    fn named_route_captures_are_percent_decoded() {
        let params = extract_named_route_captures(
            "/project/files/(?P<file_name>[^/]+)",
            "/project/files/report%202026.txt",
        );

        assert_eq!(
            params.get("file_name").map(String::as_str),
            Some("report 2026.txt")
        );
    }
}
