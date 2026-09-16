import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordGuildSchema = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().optional(),
    ownerId: z.string(),
    memberCount: z.number(),
});
export type DiscordGuildType = z.infer<typeof DiscordGuildSchema>;

@Identifier("DISCORD_GUILD")
@Name({ code: "en-US", content: "Discord Guild" })
@DisplayMessage({ code: "en-US", content: "Server: ${name}" })
@Schema(DiscordGuildSchema)
export class DiscordGuild {}
