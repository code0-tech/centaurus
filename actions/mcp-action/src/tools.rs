//! Exposes every flow connected to this action as an MCP tool: a flow's
//! `input_schema` becomes the tool's input schema, and executing the flow
//! (via `Connected::execute_flow`) produces the tool's result.
//!
//! There's no per-flow `description` anywhere in the stack yet (only
//! `name`), so tools are described using just the flow name until that gap
//! is closed upstream.

use std::sync::Arc;

use hercules::Connected;
use rmcp::ErrorData as McpError;
use rmcp::RoleServer;
use rmcp::handler::server::ServerHandler;
use rmcp::model::{
    CallToolRequestParams, CallToolResult, Implementation, ListToolsResult,
    PaginatedRequestParams, ProtocolVersion, ServerCapabilities, ServerInfo, Tool,
};
use rmcp::service::RequestContext;
use serde_json::{Map, Value};
use tucana::aquila::ActionFlow;
use tucana::shared::Struct;
use tucana::shared::Value as WireValue;
use tucana::shared::helper::value::to_json_value;
use tucana::shared::value::Kind;

#[derive(Clone)]
pub struct FlowToolServer {
    connected: Connected,
}

impl FlowToolServer {
    pub fn new(connected: Connected) -> Self {
        Self { connected }
    }
}

/// MCP tool names are opaque identifiers, not display strings, so a flow's
/// `name` (which may contain spaces or collide across flows) can't be used
/// directly -- `flow_id` is already unique and stable.
fn tool_name(flow: &ActionFlow) -> String {
    format!("flow-{}", flow.flow_id)
}

fn parse_tool_name(name: &str) -> Option<i64> {
    name.strip_prefix("flow-")?.parse().ok()
}

fn schema_object(schema: Option<&Struct>) -> Arc<Map<String, Value>> {
    let Some(schema) = schema.filter(|schema| !schema.fields.is_empty()) else {
        return Arc::new(Map::new());
    };
    match to_json_value(WireValue {
        kind: Some(Kind::StructValue(schema.clone())),
    }) {
        Value::Object(map) => Arc::new(map),
        _ => Arc::new(Map::new()),
    }
}

fn flow_to_tool(flow: &ActionFlow) -> Tool {
    let mut tool = Tool::default();
    tool.name = tool_name(flow).into();
    tool.title = Some(flow.name.clone());
    tool.description = Some(flow.name.clone().into());
    tool.input_schema = schema_object(flow.input_schema.as_ref());
    tool.output_schema = flow
        .output_schema
        .as_ref()
        .map(|schema| schema_object(Some(schema)));
    tool
}

impl ServerHandler for FlowToolServer {
    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(ServerCapabilities::builder().enable_tools().build())
            .with_protocol_version(ProtocolVersion::default())
            .with_server_info(Implementation::from_build_env())
            .with_instructions(
                "Every tool corresponds to a flow connected to this action. Call it with \
                 arguments matching its input schema to execute that flow; the result is the \
                 flow's own execution result.",
            )
    }

    async fn list_tools(
        &self,
        _request: Option<PaginatedRequestParams>,
        _context: RequestContext<RoleServer>,
    ) -> Result<ListToolsResult, McpError> {
        let tools = self.connected.flows().iter().map(flow_to_tool).collect();
        Ok(ListToolsResult::with_all_items(tools))
    }

    async fn call_tool(
        &self,
        request: CallToolRequestParams,
        _context: RequestContext<RoleServer>,
    ) -> Result<CallToolResult, McpError> {
        let flow_id = parse_tool_name(&request.name).filter(|id| self.connected.flow(*id).is_some());
        let Some(flow_id) = flow_id else {
            return Err(McpError::invalid_params(
                format!("unknown tool {:?}", request.name),
                None,
            ));
        };

        let payload = Value::Object(request.arguments.unwrap_or_default());

        log::info!("executing flow {flow_id} via tool {:?}", request.name);

        match self.connected.execute_flow(flow_id.to_string(), payload).await {
            Ok(value) => Ok(CallToolResult::structured(value)),
            Err(err) => {
                log::warn!("flow {flow_id} failed: {err}");
                Ok(CallToolResult::structured_error(Value::String(
                    err.to_string(),
                )))
            }
        }
    }
}
