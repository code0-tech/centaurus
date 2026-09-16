import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { DiscordUserSchema } from "./discordUser.js";

export const DiscordGuildMemberSchema = z.object({
    user: DiscordUserSchema,
    nickname: z.string().optional(),
    roles: z.array(z.string()),
    joinedAt: z.string().optional(),
    guildId: z.string(),
});
export type DiscordGuildMemberType = z.infer<typeof DiscordGuildMemberSchema>;

@Identifier("DISCORD_GUILD_MEMBER")
@Name({ code: "en-US", content: "Discord Guild Member" })
@DisplayMessage({ code: "en-US", content: "Discord Member: ${user.username}" })
@Schema(DiscordGuildMemberSchema)
export class DiscordGuildMember {}
