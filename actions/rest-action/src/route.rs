//! Pure URL-pattern compilation helpers, shared by `registry.rs` (which
//! precompiles each flow's pattern into a `Regex` once, at flow-upsert time)
//! and this module's own tests. No per-request matching lives here anymore —
//! see `registry.rs::RouteRegistry::find` for that.

use tucana::aquila::ActionFlow;

pub fn flow_route_pattern(flow: &ActionFlow, flow_http_url: &str) -> String {
    format!("/{}{}", flow.project_slug, flow_http_url)
}

pub fn compile_route_pattern(pattern: &str) -> Result<String, String> {
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
    use super::compile_route_pattern;

    fn matches(pattern: &str, route: &str) -> bool {
        let Ok(anchored) = compile_route_pattern(pattern) else {
            return false;
        };
        let Ok(regex) = regex::Regex::new(&anchored) else {
            return false;
        };
        regex.is_match(route)
    }

    #[test]
    fn exact_literal_match_works() {
        assert!(matches("test2", "test2"));
    }

    #[test]
    fn substring_match_is_rejected() {
        assert!(!matches("test", "test2"));
    }

    #[test]
    fn dynamic_route_params_match_path_segments() {
        assert!(matches("/project/users/:id", "/project/users/42"));
        assert!(!matches("/project/users/:id", "/project/users/42/orders"));
    }

    #[test]
    fn dynamic_route_wildcards_match_remaining_path() {
        assert!(matches(
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
        assert!(matches(
            "/project/users/(?P<user_id>[^/]+)",
            "/project/users/42"
        ));
    }

    #[test]
    fn invalid_regex_returns_false() {
        assert!(!matches("(", "/test"));
    }
}
