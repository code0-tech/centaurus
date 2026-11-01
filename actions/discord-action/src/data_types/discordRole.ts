import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordRoleSchema = z.object({
    id: z.string(),
    guildId: z.string(),
    name: z.string(),
    color: z.number(),
    position: z.number(),
});
export type DiscordRoleType = z.infer<typeof DiscordRoleSchema>;

@Identifier("DISCORD_ROLE")
@Name({ code: "en-US", content: "Discord Role" })
@DisplayMessage({ code: "en-US", content: "Role: @${name}" })
@Schema(DiscordRoleSchema)
export class DiscordRole {}
