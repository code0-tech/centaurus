import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A Notion user reference (person or bot). Returned on `created_by` /
 * `last_edited_by` and people properties.
 * See https://developers.notion.com/reference/user
 */
export const NotionUserSchema = z.object({
    object: z.literal("user").optional(),
    id: z.string(),
    type: z.enum(["person", "bot"]).optional(),
    name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    person: z.object({ email: z.string().optional() }).optional(),
    bot: z.record(z.string(), z.any()).optional(),
});
export type NotionUser = z.infer<typeof NotionUserSchema>;

@Identifier("NOTION_USER")
@Name({ code: "en-US", content: "Notion user" })
@DisplayMessage({ code: "en-US", content: "Notion user ${id}" })
@Schema(NotionUserSchema)
export class NotionUserDataType {}
