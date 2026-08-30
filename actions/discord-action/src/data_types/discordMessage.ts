import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { DiscordUserSchema } from "./discordUser.js";
import { DiscordEmbedSchema } from "./discordEmbed.js";
import { DiscordAttachmentSchema } from "./discordAttachment.js";

export const DiscordMessageSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    guildId: z.string().optional(),
    author: DiscordUserSchema,
    content: z.string(),
    embeds: z.array(DiscordEmbedSchema),
    attachments: z.array(DiscordAttachmentSchema),
    mentions: z.array(z.string()),
    referencedMessageId: z.string().optional(),
    createdAt: z.string(),
});
export type DiscordMessageType = z.infer<typeof DiscordMessageSchema>;

@Identifier("DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Discord Message" })
@DisplayMessage({ code: "en-US", content: "Discord Message: ${id}" })
@Schema(DiscordMessageSchema)
export class DiscordMessage {}
