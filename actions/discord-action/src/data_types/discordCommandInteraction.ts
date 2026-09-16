import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { DiscordUserSchema } from "./discordUser.js";

export const DiscordCommandOptionSchema = z.object({
    name: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
});

export const DiscordCommandInteractionSchema = z.object({
    id: z.string(),
    commandName: z.string(),
    options: z.array(DiscordCommandOptionSchema),
    user: DiscordUserSchema,
    channelId: z.string(),
    guildId: z.string().optional(),
});
export type DiscordCommandInteractionType = z.infer<typeof DiscordCommandInteractionSchema>;

@Identifier("DISCORD_COMMAND_INTERACTION")
@Name({ code: "en-US", content: "Discord Command Interaction" })
@DisplayMessage({ code: "en-US", content: "Slash Command: /${commandName}" })
@Schema(DiscordCommandInteractionSchema)
export class DiscordCommandInteraction {}
