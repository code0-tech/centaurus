import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordChannelTypeEnum = z.enum([
    "text",
    "voice",
    "category",
    "announcement",
    "thread",
    "forum",
    "dm",
    "unknown",
]);
export type DiscordChannelTypeType = z.infer<typeof DiscordChannelTypeEnum>;

export const DiscordChannelSchema = z.object({
    id: z.string(),
    guildId: z.string().optional(),
    name: z.string(),
    type: DiscordChannelTypeEnum,
    topic: z.string().optional(),
    parentId: z.string().optional(),
});
export type DiscordChannelDataType = z.infer<typeof DiscordChannelSchema>;

@Identifier("DISCORD_CHANNEL_TYPE")
@Name({ code: "en-US", content: "Discord Channel Type" })
@DisplayMessage({ code: "en-US", content: "Channel Type: ${type}" })
@Schema(DiscordChannelTypeEnum)
export class DiscordChannelType {}

@Identifier("DISCORD_CHANNEL")
@Name({ code: "en-US", content: "Discord Channel" })
@DisplayMessage({ code: "en-US", content: "Channel: #${name}" })
@Schema(DiscordChannelSchema)
export class DiscordChannel {}
