import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { DiscordUserSchema } from "./discordUser.js";

export const DiscordReactionSchema = z.object({
    emoji: z.string(),
    messageId: z.string(),
    channelId: z.string(),
    user: DiscordUserSchema,
});
export type DiscordReactionType = z.infer<typeof DiscordReactionSchema>;

@Identifier("DISCORD_REACTION")
@Name({ code: "en-US", content: "Discord Reaction" })
@DisplayMessage({ code: "en-US", content: "Reaction: ${emoji}" })
@Schema(DiscordReactionSchema)
export class DiscordReaction {}
