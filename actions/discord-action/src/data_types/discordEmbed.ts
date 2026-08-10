import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordEmbedFooterDataSchema = z.object({
    text: z.string(),
    iconUrl: z.string().optional(),
});
export type DiscordEmbedFooterData = z.infer<typeof DiscordEmbedFooterDataSchema>;

export const DiscordEmbedAuthorDataSchema = z.object({
    name: z.string(),
    url: z.string().optional(),
    iconUrl: z.string().optional(),
});
export type DiscordEmbedAuthorData = z.infer<typeof DiscordEmbedAuthorDataSchema>;

export const DiscordEmbedDataSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    color: z.string().optional(),
    timestamp: z.string().optional(),
    footer: DiscordEmbedFooterDataSchema.optional(),
    imageUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    author: DiscordEmbedAuthorDataSchema.optional(),
});
export type DiscordEmbedData = z.infer<typeof DiscordEmbedDataSchema>;

@Identifier("DISCORD_EMBED_FOOTER")
@Name({ code: "en-US", content: "Discord Embed Footer" })
@DisplayMessage({ code: "en-US", content: "Discord Embed Footer: ${text}" })
@Schema(DiscordEmbedFooterDataSchema)
export class DiscordEmbedFooterDataType {}

@Identifier("DISCORD_EMBED_AUTHOR")
@Name({ code: "en-US", content: "Discord Embed Author" })
@DisplayMessage({ code: "en-US", content: "Discord Embed Author: ${name}" })
@Schema(DiscordEmbedAuthorDataSchema)
export class DiscordEmbedAuthorDataType {}

@Identifier("DISCORD_EMBED")
@Name({ code: "en-US", content: "Discord Embed" })
@DisplayMessage({ code: "en-US", content: "Discord Embed object" })
@Schema(DiscordEmbedDataSchema)
export class DiscordEmbedDataType {}
