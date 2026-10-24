import { RuntimeError } from "@code0-tech/hercules";
import type { AiMcpServer } from "../datatypes/Mcp.server.datatype.js";
import { toConnection } from "./Mcp.toConnection.util.js";

export function validateMcpServers(servers: AiMcpServer[]): void {
    const names: string[] = servers.map((server) => server.name);
    const duplicate: string | undefined = names.find((name, index) => names.indexOf(name) !== index);
    if (duplicate) {
        throw new RuntimeError(
            "ERROR_DUPLICATE_AI_MCP_SERVER",
            `More than one MCP server is named "${duplicate}". MCP tool names are namespaced with the server name, so the names must be unique.`,
        );
    }

    servers.forEach(toConnection);
}
