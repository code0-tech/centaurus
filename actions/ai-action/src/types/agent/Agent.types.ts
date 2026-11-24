import type { SubFlow } from "@code0-tech/hercules";
import type { AiMcpServer } from "../../datatypes/mcp/Mcp.server.datatype.js";

/** A tool of an agent: a flow of the project, or an MCP server to discover tools from. */
export type ToolEntry = SubFlow | AiMcpServer;

/** Everything an agent is built from, as the node collected it. */
export interface AgentDefinition {
    name: string;
    systemPrompt: string;
    model: SubFlow;
    tools: ToolEntry[];
    middleware: SubFlow[];
    /** The JSON schema of the type the agent has to answer in, when one was asked for. */
    outputSchema?: Record<string, unknown>;
}
