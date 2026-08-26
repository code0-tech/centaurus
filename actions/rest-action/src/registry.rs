//! An immutable, precompiled route table, rebuilt (copy-on-write) whenever a
//! flow is upserted or deleted — see `HerculesEvent::FlowUpserted`/
//! `FlowDeleted` handling in `main.rs`. Replaces the old per-request linear
//! scan over `Connected::flows()` (`route::find_matching_flow`) with an
//! O(routes in this project+method) lookup against a snapshot that's never
//! mutated after construction, so request handlers never take a lock beyond
//! the instant it takes to clone an `Arc` pointer to the current snapshot.
//!
//! Every `ActionFlow`'s route pattern is `/{project_slug}{http_url}`
//! (`route::flow_route_pattern`), so `project_slug` is always a static first
//! path segment — that's the index key alongside the HTTP method, cutting
//! each lookup down from "every flow this action owns" to "flows in this
//! one project with this one method".

use std::collections::HashMap;
use std::sync::Arc;

use hyper::Method;
use regex::Regex;
use tucana::aquila::ActionFlow;
use tucana::shared::Struct;

use crate::{flow_setting, route, validation};

/// The outcome of compiling a flow's `input_schema` at upsert time, carried
/// forward so a request never has to touch the schema document again.
pub enum SchemaValidation {
    /// No `input_schema` (or an empty one): any body is accepted.
    None,
    /// A precompiled validator: run it against the parsed request body.
    Compiled(jsonschema::Validator),
    /// The stored `input_schema` failed to compile. Every request against
    /// this route fails schema validation with this message — matches the
    /// pre-registry behavior of re-attempting (and re-failing) compilation
    /// on every request, just without actually redoing the work.
    Invalid(String),
}

pub struct CompiledRoute {
    pub flow: Arc<ActionFlow>,
    pub method: Method,
    pub regex: Regex,
    param_names: Vec<Box<str>>,
    pub validation: SchemaValidation,
}

impl CompiledRoute {
    /// Reads path params out of a match already produced by this route's own
    /// `regex` (see `RouteRegistry::find`) — no second regex pass.
    pub fn path_params(&self, captures: &regex::Captures<'_>) -> HashMap<String, String> {
        self.param_names
            .iter()
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

    pub fn validator(&self) -> Result<Option<&jsonschema::Validator>, String> {
        match &self.validation {
            SchemaValidation::None => Ok(None),
            SchemaValidation::Compiled(validator) => Ok(Some(validator)),
            SchemaValidation::Invalid(message) => Err(message.clone()),
        }
    }
}

#[derive(Default)]
pub struct RouteRegistry {
    entries: HashMap<i64, Arc<CompiledRoute>>,
    by_method_and_prefix: HashMap<(Method, String), Vec<Arc<CompiledRoute>>>,
}

impl RouteRegistry {
    /// Builds a registry from a full set of flows in a single pass — one
    /// index rebuild total, rather than the O(n) rebuilds (one per flow,
    /// each over the entries accumulated so far) that seeding via a loop of
    /// `upsert` calls would do. Used once at startup to seed from
    /// `Connected::flows()`; ongoing changes arrive one flow at a time via
    /// `FlowUpserted`/`FlowDeleted` and go through `upsert`/`remove`
    /// instead, which is the right granularity there.
    pub fn from_flows(flows: impl IntoIterator<Item = Arc<ActionFlow>>) -> RouteRegistry {
        let mut entries = HashMap::new();
        for flow in flows {
            if let Some(route) = compile_route(&flow) {
                entries.insert(flow.flow_id, Arc::new(route));
            }
        }
        Self::rebuild(entries)
    }

    /// Returns a new registry with `flow` compiled and inserted (replacing
    /// any previous route for the same `flow_id`), or with that `flow_id`
    /// removed if it's no longer routable (missing/invalid
    /// `http_method`/`http_url` — mirrors the old linear-scan matcher's
    /// behavior of silently skipping such flows).
    pub fn upsert(&self, flow: Arc<ActionFlow>) -> RouteRegistry {
        let mut entries = self.entries.clone();
        match compile_route(&flow) {
            Some(route) => {
                entries.insert(flow.flow_id, Arc::new(route));
            }
            None => {
                entries.remove(&flow.flow_id);
            }
        }
        Self::rebuild(entries)
    }

    pub fn remove(&self, flow_id: i64) -> RouteRegistry {
        let mut entries = self.entries.clone();
        entries.remove(&flow_id);
        Self::rebuild(entries)
    }

    fn rebuild(entries: HashMap<i64, Arc<CompiledRoute>>) -> RouteRegistry {
        let mut by_method_and_prefix: HashMap<(Method, String), Vec<Arc<CompiledRoute>>> =
            HashMap::new();
        for route in entries.values() {
            by_method_and_prefix
                .entry((route.method.clone(), route.flow.project_slug.clone()))
                .or_default()
                .push(Arc::clone(route));
        }
        RouteRegistry {
            entries,
            by_method_and_prefix,
        }
    }

    /// Finds the first route matching `method`+`path`, returning it together
    /// with the `Captures` that confirmed the match — reused by the caller
    /// to read path params without matching the regex a second time.
    pub fn find<'p>(
        &self,
        method: &Method,
        path: &'p str,
    ) -> Option<(Arc<CompiledRoute>, regex::Captures<'p>)> {
        let prefix = first_path_segment(path)?;
        let bucket = self
            .by_method_and_prefix
            .get(&(method.clone(), prefix.to_string()))?;
        for route in bucket {
            if let Some(captures) = route.regex.captures(path) {
                return Some((Arc::clone(route), captures));
            }
        }
        None
    }

    #[cfg(test)]
    pub fn route_count(&self) -> usize {
        self.entries.len()
    }
}

fn first_path_segment(path: &str) -> Option<&str> {
    let trimmed = path.strip_prefix('/')?;
    Some(trimmed.split('/').next().unwrap_or(trimmed))
}

fn compile_route(flow: &Arc<ActionFlow>) -> Option<CompiledRoute> {
    let Some(flow_method) = flow_setting::as_string(flow, "http_method") else {
        log::warn!(
            "route reject: flow_id={} reason=missing_or_invalid_http_method",
            flow.flow_id
        );
        return None;
    };
    let Ok(method) = Method::from_bytes(flow_method.to_ascii_uppercase().as_bytes()) else {
        log::warn!(
            "route reject: flow_id={} reason=invalid_http_method value={:?}",
            flow.flow_id,
            flow_method
        );
        return None;
    };

    let Some(flow_http_url) = flow_setting::as_string(flow, "http_url") else {
        log::warn!(
            "route reject: flow_id={} reason=missing_or_invalid_http_url",
            flow.flow_id
        );
        return None;
    };

    let pattern = route::flow_route_pattern(flow, flow_http_url);
    let Ok(anchored) = route::compile_route_pattern(&pattern) else {
        log::warn!(
            "route reject: flow_id={} reason=invalid_url_pattern pattern={:?}",
            flow.flow_id,
            pattern
        );
        return None;
    };
    let Ok(regex) = Regex::new(&anchored) else {
        log::warn!(
            "route reject: flow_id={} reason=invalid_compiled_regex pattern={:?}",
            flow.flow_id,
            anchored
        );
        return None;
    };
    let param_names: Vec<Box<str>> = regex.capture_names().flatten().map(Box::from).collect();

    let validation = compile_schema_validation(flow_setting::as_struct(flow, "input_schema"));

    Some(CompiledRoute {
        flow: Arc::clone(flow),
        method,
        regex,
        param_names,
        validation,
    })
}

fn compile_schema_validation(input_schema: Option<&Struct>) -> SchemaValidation {
    let Some(input_schema) = input_schema.filter(|schema| !schema.fields.is_empty()) else {
        return SchemaValidation::None;
    };

    match validation::compile_validator(input_schema) {
        Ok(validator) => SchemaValidation::Compiled(validator),
        Err(err) => SchemaValidation::Invalid(err.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tucana::shared::{FlowSetting, Value, value::Kind};

    fn flow(flow_id: i64, project_slug: &str, method: &str, url: &str) -> Arc<ActionFlow> {
        Arc::new(ActionFlow {
            flow_id,
            project_slug: project_slug.to_string(),
            settings: vec![
                FlowSetting {
                    database_id: None,
                    flow_setting_id: "http_method".to_string(),
                    value: Some(Value {
                        kind: Some(Kind::StringValue(method.to_string())),
                    }),
                    cast: None,
                },
                FlowSetting {
                    database_id: None,
                    flow_setting_id: "http_url".to_string(),
                    value: Some(Value {
                        kind: Some(Kind::StringValue(url.to_string())),
                    }),
                    cast: None,
                },
            ],
            ..Default::default()
        })
    }

    fn flow_with_schema(
        flow_id: i64,
        project_slug: &str,
        method: &str,
        url: &str,
        schema: serde_json::Value,
    ) -> Arc<ActionFlow> {
        let mut flow = (*flow(flow_id, project_slug, method, url)).clone();
        let Value {
            kind: Some(Kind::StructValue(schema)),
        } = tucana::shared::helper::value::from_json_value(schema)
        else {
            panic!("expected object schema");
        };
        flow.settings.push(FlowSetting {
            database_id: None,
            flow_setting_id: "input_schema".to_string(),
            value: Some(Value {
                kind: Some(Kind::StructValue(schema)),
            }),
            cast: None,
        });
        Arc::new(flow)
    }

    #[test]
    fn from_flows_builds_the_same_registry_as_sequential_upserts() {
        let flows = [
            flow(1, "acme", "GET", "/users"),
            flow(2, "acme", "POST", "/orders"),
            flow(3, "widgets", "GET", "/parts/:id"),
        ];

        let bulk = RouteRegistry::from_flows(flows.iter().cloned());
        assert_eq!(bulk.route_count(), 3);
        assert!(bulk.find(&Method::GET, "/acme/users").is_some());
        assert!(bulk.find(&Method::POST, "/acme/orders").is_some());
        assert!(bulk.find(&Method::GET, "/widgets/parts/42").is_some());
    }

    #[test]
    fn from_flows_skips_unroutable_flows_like_upsert_does() {
        let mut bad_flow = (*flow(1, "acme", "GET", "/users")).clone();
        bad_flow
            .settings
            .retain(|s| s.flow_setting_id != "http_method");

        let registry =
            RouteRegistry::from_flows([Arc::new(bad_flow), flow(2, "acme", "GET", "/accounts")]);

        assert_eq!(registry.route_count(), 1);
        assert!(registry.find(&Method::GET, "/acme/accounts").is_some());
    }

    #[test]
    fn finds_exact_match_by_method_and_path() {
        let registry = RouteRegistry::default().upsert(flow(1, "acme", "GET", "/users"));
        let (route, _) = registry
            .find(&Method::GET, "/acme/users")
            .expect("expected a match");
        assert_eq!(route.flow.flow_id, 1);
    }

    #[test]
    fn method_mismatch_does_not_match() {
        let registry = RouteRegistry::default().upsert(flow(1, "acme", "GET", "/users"));
        assert!(registry.find(&Method::POST, "/acme/users").is_none());
    }

    #[test]
    fn unmatched_path_returns_none() {
        let registry = RouteRegistry::default().upsert(flow(1, "acme", "GET", "/users"));
        assert!(registry.find(&Method::GET, "/acme/orders").is_none());
        assert!(
            registry
                .find(&Method::GET, "/other-project/users")
                .is_none()
        );
    }

    #[test]
    fn method_is_matched_case_insensitively_at_compile_time() {
        let registry = RouteRegistry::default().upsert(flow(1, "acme", "get", "/users"));
        assert!(registry.find(&Method::GET, "/acme/users").is_some());
    }

    #[test]
    fn path_params_are_extracted_from_the_original_match_and_percent_decoded() {
        let registry =
            RouteRegistry::default().upsert(flow(1, "acme", "GET", "/books/:category/:id"));
        let (route, captures) = registry
            .find(&Method::GET, "/acme/books/sci-fi/report%202026")
            .expect("expected a match");
        let params = route.path_params(&captures);
        assert_eq!(params.get("category").map(String::as_str), Some("sci-fi"));
        assert_eq!(params.get("id").map(String::as_str), Some("report 2026"));
    }

    #[test]
    fn upsert_replaces_the_previous_route_for_the_same_flow_id() {
        let registry = RouteRegistry::default().upsert(flow(1, "acme", "GET", "/users"));
        let registry = registry.upsert(flow(1, "acme", "GET", "/accounts"));
        assert_eq!(registry.route_count(), 1);
        assert!(registry.find(&Method::GET, "/acme/users").is_none());
        assert!(registry.find(&Method::GET, "/acme/accounts").is_some());
    }

    #[test]
    fn remove_drops_the_route() {
        let registry = RouteRegistry::default().upsert(flow(1, "acme", "GET", "/users"));
        let registry = registry.remove(1);
        assert_eq!(registry.route_count(), 0);
        assert!(registry.find(&Method::GET, "/acme/users").is_none());
    }

    #[test]
    fn flow_missing_http_method_is_not_routable() {
        let mut bad_flow = (*flow(1, "acme", "GET", "/users")).clone();
        bad_flow
            .settings
            .retain(|s| s.flow_setting_id != "http_method");
        let registry = RouteRegistry::default().upsert(Arc::new(bad_flow));
        assert_eq!(registry.route_count(), 0);
    }

    #[test]
    fn compiled_validator_is_reused_across_lookups() {
        let registry = RouteRegistry::default().upsert(flow_with_schema(
            1,
            "acme",
            "POST",
            "/users",
            serde_json::json!({
                "type": "object",
                "required": ["name"],
                "properties": { "name": { "type": "string" } }
            }),
        ));
        let (route, _) = registry.find(&Method::POST, "/acme/users").unwrap();
        let validator = route.validator().unwrap().expect("expected a validator");
        assert!(validator.is_valid(&serde_json::json!({ "name": "Ada" })));
        assert!(!validator.is_valid(&serde_json::json!({ "age": 42 })));
    }

    #[test]
    fn invalid_input_schema_marks_the_route_as_always_failing_validation() {
        let registry = RouteRegistry::default().upsert(flow_with_schema(
            1,
            "acme",
            "POST",
            "/users",
            serde_json::json!({ "type": "not-a-real-type" }),
        ));
        let (route, _) = registry.find(&Method::POST, "/acme/users").unwrap();
        assert!(route.validator().is_err());
    }
}
