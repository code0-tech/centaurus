import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A Notion query filter: a property/timestamp filter or an and/or group.
 * Kept as a plain object on purpose: the generated filter union (~10k
 * characters) makes the flow editor's type checker take seconds per node,
 * which stalls parameter suggestions. Notion validates the filter itself.
 */
export const NotionFilterSchema = z.record(z.string(), z.unknown());
export type NotionFilter = z.infer<typeof NotionFilterSchema>;

@Identifier("NOTION_FILTER")
@Name({ code: "en-US", content: "Notion database filter" })
@DisplayMessage({ code: "en-US", content: "Notion database filter" })
@Schema(NotionFilterSchema)
export class NotionFilterDataType {}
