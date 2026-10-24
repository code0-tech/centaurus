import { RuntimeError } from "@code0-tech/hercules";
import type { Connection } from "@langchain/mcp-adapters";
import type { AiMcpServer } from "../datatypes/Mcp.server.datatype.js";

export function toConnection(server: AiMcpServer): Connection {
    if (server.transport === "stdio") {
        if (!server.command) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_MCP_SERVER",
                `MCP server "${server.name}" uses the stdio transport and therefore needs a command.`,
            );
        }

        return {
            transport: "stdio",
            command: server.command,
            args: server.args ?? [],
            ...(server.env ? { env: server.env as Record<string, string> } : {}),
            ...(server.cwd ? { cwd: server.cwd } : {}),
            ...(server.default_tool_timeout_ms ? { defaultToolTimeout: server.default_tool_timeout_ms } : {}),
        } as Connection;
    }

    if (!server.url) {
        throw new RuntimeError(
            "ERROR_INVALID_AI_MCP_SERVER",
            `MCP server "${server.name}" uses the ${server.transport} transport and therefore needs a url.`,
        );
    }

    return {
        transport: server.transport,
        url: server.url,
        ...(server.headers ? { headers: server.headers as Record<string, string> } : {}),
        ...(server.default_tool_timeout_ms ? { defaultToolTimeout: server.default_tool_timeout_ms } : {}),
    } as Connection;
}
