import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiMcpTransportSchema = z.enum(["http", "sse", "stdio"]);
export type AiMcpTransport = z.infer<typeof AiMcpTransportSchema>;

@Identifier("AI_MCP_TRANSPORT")
@Name({ code: "en-US", content: "MCP transport" })
@DisplayMessage({ code: "en-US", content: "MCP transport" })
@Schema(AiMcpTransportSchema)
export class AiMcpTransportDataType {}
