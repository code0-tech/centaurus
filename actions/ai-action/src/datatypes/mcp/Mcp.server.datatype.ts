import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiMcpTransportSchema } from "./Mcp.transport.datatype.js";

export const AiMcpServerSchema = z.object({
    name: z.string().min(1),
    transport: AiMcpTransportSchema.default("http"),
    url: z.string().optional(),
    headers: z.looseObject({}).optional(),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    env: z.looseObject({}).optional(),
    cwd: z.string().optional(),
    default_tool_timeout_ms: z.number().int().min(1).optional(),
    allowed_tools: z.array(z.string()).optional(),
});
export type AiMcpServer = z.infer<typeof AiMcpServerSchema>;

@Identifier("AI_MCP_SERVER")
@Name({ code: "en-US", content: "MCP server" })
@DisplayMessage({ code: "en-US", content: "MCP server ${name}" })
@Schema(AiMcpServerSchema)
export class AiMcpServerDataType {}
