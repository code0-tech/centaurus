import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const DiscordUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    globalName: z.string().optional(),
    avatar: z.string().optional(),
    bot: z.boolean(),
});
export type DiscordUserType = z.infer<typeof DiscordUserSchema>;

@Identifier("DISCORD_USER")
@Name({ code: "en-US", content: "Discord User" })
@DisplayMessage({ code: "en-US", content: "Discord User: ${username}" })
@Schema(DiscordUserSchema)
export class DiscordUser {}
