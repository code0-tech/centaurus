import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordEmbedFieldSchema = z.object({
    name: z.string(),
    value: z.string(),
    inline: z.boolean().nullish(),
});
export type DiscordEmbedFieldType = z.infer<typeof DiscordEmbedFieldSchema>;

export const DiscordEmbedFooterSchema = z.object({
    text: z.string(),
    iconUrl: z.string().nullish(),
});
export type DiscordEmbedFooterType = z.infer<typeof DiscordEmbedFooterSchema>;

export const DiscordEmbedAuthorSchema = z.object({
    name: z.string(),
    url: z.string().nullish(),
    iconUrl: z.string().nullish(),
});
export type DiscordEmbedAuthorType = z.infer<typeof DiscordEmbedAuthorSchema>;

export const DiscordEmbedSchema = z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
    url: z.string().nullish(),
    color: z.union([z.number(), z.string()]).nullish(),
    timestamp: z.string().nullish(),
    footer: DiscordEmbedFooterSchema.nullish(),
    imageUrl: z.string().nullish(),
    thumbnailUrl: z.string().nullish(),
    author: DiscordEmbedAuthorSchema.nullish(),
    fields: z.array(DiscordEmbedFieldSchema).nullish(),
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
