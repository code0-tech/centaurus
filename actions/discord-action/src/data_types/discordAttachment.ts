import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordAttachmentSchema = z.object({
    id: z.string(),
    filename: z.string(),
    contentType: z.string().optional(),
    size: z.number(),
    url: z.string(),
});
export type DiscordAttachmentType = z.infer<typeof DiscordAttachmentSchema>;

@Identifier("DISCORD_ATTACHMENT")
@Name({ code: "en-US", content: "Discord Attachment" })
@DisplayMessage({ code: "en-US", content: "Attachment: ${filename}" })
@Schema(DiscordAttachmentSchema)
export class DiscordAttachment {}
