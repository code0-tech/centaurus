import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordEmbedFieldSchema = z.object({
    name: z.string(),
    value: z.string(),
    inline: z.boolean().optional(),
});
export type DiscordEmbedFieldType = z.infer<typeof DiscordEmbedFieldSchema>;

export const DiscordEmbedFooterSchema = z.object({
    text: z.string(),
    iconUrl: z.string().optional(),
});
export type DiscordEmbedFooterType = z.infer<typeof DiscordEmbedFooterSchema>;

export const DiscordEmbedAuthorSchema = z.object({
    name: z.string(),
    url: z.string().optional(),
    iconUrl: z.string().optional(),
});
export type DiscordEmbedAuthorType = z.infer<typeof DiscordEmbedAuthorSchema>;

export const DiscordEmbedSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    color: z.union([z.number(), z.string()]).optional(),
    timestamp: z.string().optional(),
    footer: DiscordEmbedFooterSchema.optional(),
    imageUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    author: DiscordEmbedAuthorSchema.optional(),
    fields: z.array(DiscordEmbedFieldSchema).optional(),
});
export type DiscordEmbedType = z.infer<typeof DiscordEmbedSchema>;

@Identifier("DISCORD_EMBED_FIELD")
@Name({ code: "en-US", content: "Discord Embed Field" })
@DisplayMessage({ code: "en-US", content: "Embed Field: ${name}" })
@Schema(DiscordEmbedFieldSchema)
export class DiscordEmbedField {}

@Identifier("DISCORD_EMBED_FOOTER")
@Name({ code: "en-US", content: "Discord Embed Footer" })
@DisplayMessage({ code: "en-US", content: "Embed Footer: ${text}" })
@Schema(DiscordEmbedFooterSchema)
export class DiscordEmbedFooter {}

@Identifier("DISCORD_EMBED_AUTHOR")
@Name({ code: "en-US", content: "Discord Embed Author" })
@DisplayMessage({ code: "en-US", content: "Embed Author: ${name}" })
@Schema(DiscordEmbedAuthorSchema)
export class DiscordEmbedAuthor {}

@Identifier("DISCORD_EMBED")
@Name({ code: "en-US", content: "Discord Embed" })
@DisplayMessage({ code: "en-US", content: "Discord Embed" })
@Schema(DiscordEmbedSchema)
export class DiscordEmbed {}
