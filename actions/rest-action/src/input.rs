//! Builds the flow input value (`payload`/`headers`/`query_params`/
//! `path_params`, matching `REST_ADAPTER_INPUT`) from an incoming request.
//! Ported from draco's REST adapter unchanged.

use hyper::{HeaderMap, header::HeaderValue};
use std::collections::HashMap;
use tucana::aquila::ActionFlow;
use tucana::shared::{Struct, Value, helper::value::ToValue, value::Kind};

use crate::route;

pub fn build_flow_input(
    flow: &ActionFlow,
    path: &str,
    query: Option<&str>,
    headers: &HeaderMap<HeaderValue>,
    payload: Option<Value>,
) -> Value {
    let mut fields = HashMap::new();

    if let Some(payload) = payload {
        fields.insert(String::from("payload"), payload);
    }

    fields.insert(
        String::from("headers"),
        string_map_to_value(header_map(headers)),
    );
    fields.insert(
        String::from("query_params"),
        string_map_to_value(query_params(query)),
    );
    fields.insert(
        String::from("path_params"),
        string_map_to_value(route::extract_path_params(flow, path)),
    );

    Value {
        kind: Some(Kind::StructValue(Struct { fields })),
    }
}

fn header_map(headers: &HeaderMap<HeaderValue>) -> HashMap<String, String> {
    headers
        .iter()
        .map(|(name, value)| {
            let value = value
                .to_str()
                .map(str::to_owned)
                .unwrap_or_else(|_| String::from_utf8_lossy(value.as_bytes()).into_owned());
            (name.as_str().to_owned(), value)
        })
        .collect()
}

fn query_params(query: Option<&str>) -> HashMap<String, String> {
    let Some(query) = query else {
        return HashMap::new();
    };

    // Repeated query keys use last-write-wins because taurus receives a
    // simple object here, not a multi-map.
    form_urlencoded::parse(query.as_bytes())
        .map(|(key, value)| (key.into_owned(), value.into_owned()))
        .collect()
}

fn string_map_to_value(map: HashMap<String, String>) -> Value {
    Value {
        kind: Some(Kind::StructValue(Struct {
            fields: map
                .into_iter()
                .map(|(key, value)| (key, value.to_value()))
                .collect(),
        })),
    }
}

#[cfg(test)]
mod tests {
    use super::{build_flow_input, query_params, string_map_to_value};
    use hyper::HeaderMap;
    use tucana::aquila::ActionFlow;
    use tucana::shared::{FlowSetting, Struct, Value, value::Kind};

    #[test]
    fn query_params_are_percent_decoded() {
        let params = query_params(Some("search=hello+world&tag=a%2Fb&empty="));
        assert_eq!(
            params.get("search").map(String::as_str),
            Some("hello world")
        );
        assert_eq!(params.get("tag").map(String::as_str), Some("a/b"));
        assert_eq!(params.get("empty").map(String::as_str), Some(""));
    }

    #[test]
    fn string_map_is_converted_to_struct_value() {
        let value =
            string_map_to_value([("id".to_string(), "42".to_string())].into_iter().collect());
        let Value {
            kind: Some(Kind::StructValue(Struct { fields })),
        } = value
        else {
            panic!("expected struct value");
        };
        assert_eq!(
            fields.get("id").and_then(|value| value.kind.as_ref()),
            Some(&Kind::StringValue("42".to_string()))
        );
    }

    #[test]
    fn flow_input_contains_query_and_path_params() {
        let flow = ActionFlow {
            flow_id: 1,
            project_slug: "project".to_string(),
            settings: vec![FlowSetting {
                database_id: None,
                flow_setting_id: "http_url".to_string(),
                value: Some(Value {
                    kind: Some(Kind::StringValue("/users/:user_id".to_string())),
                }),
                cast: None,
            }],
            ..Default::default()
        };

        let input = build_flow_input(
            &flow,
            "/project/users/42",
            Some("search=hello+world"),
            &HeaderMap::new(),
            None,
        );

        assert_eq!(
            nested_string_field(&input, "query_params", "search"),
            Some("hello world")
        );
        assert_eq!(
            nested_string_field(&input, "path_params", "user_id"),
            Some("42")
        );
    }

    fn nested_string_field<'a>(value: &'a Value, field: &str, nested: &str) -> Option<&'a str> {
        let Some(Kind::StructValue(Struct { fields })) = value.kind.as_ref() else {
            return None;
        };
        let Some(Value {
            kind:
                Some(Kind::StructValue(Struct {
                    fields: nested_fields,
                })),
        }) = fields.get(field)
        else {
            return None;
        };
        let Some(Value {
            kind: Some(Kind::StringValue(value)),
        }) = nested_fields.get(nested)
        else {
            return None;
        };
        Some(value.as_str())
    }
}
