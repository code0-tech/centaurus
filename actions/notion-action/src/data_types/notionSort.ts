import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * Sorts by a column. Notion also sorts by timestamp ({ timestamp, direction }),
 * but that second shape made the flow editor offer two kinds of sort; queries
 * without a sort are ordered by created_time, newest first, instead.
 */
export const NotionSortSchema = z.object({
    property: z.string().describe("Name of the column to sort by"),
    direction: z.enum(["ascending", "descending"]),
});
export type NotionSort = z.infer<typeof NotionSortSchema>;

@Identifier("NOTION_SORT")
@Name({ code: "en-US", content: "Notion database sort" })
@DisplayMessage({ code: "en-US", content: "Notion database sort" })
@Schema(NotionSortSchema)
export class NotionSortDataType {}
