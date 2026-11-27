import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { WebhookClient } from "discord.js";
import { getDiscordClient } from "../../client.js";
import { buildMessagePayload, handleDiscordError, mapApiMessage } from "../../helpers.js";
import { DiscordEmbedType } from "../../data_types/discordEmbed.js";
import { DiscordMessageType } from "../../data_types/discordMessage.js";

@Identifier("discordAnswerSlashCommand")
@Signature("(botToken: string, interactionToken: string, content?: string, embed?: DISCORD_EMBED): DISCORD_MESSAGE")
@Name({ code: "en-US", content: "Answer slash command" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Answer slash command" })
@Documentation({
    code: "en-US",
    content: "Answers a slash command, replacing the placeholder Discord shows while the flow runs.",
})
@Description({ code: "en-US", content: "Answer the slash command that started the flow." })
@Parameter({
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Bot token" }],
    description: [{ code: "en-US", content: "The token of the Discord bot the slash command belongs to." }],
})
@Parameter({
    runtimeName: "interactionToken",
    name: [{ code: "en-US", content: "Command token" }],
    description: [{ code: "en-US", content: "The command token from the slash command event that started this flow." }],
})
@Parameter({
    runtimeName: "content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The text of the answer." }],
    optional: true,
})
@Parameter({
    runtimeName: "embed",
    name: [{ code: "en-US", content: "Embed" }],
    description: [{ code: "en-US", content: "Optional embed to send with the answer." }],
    optional: true,
})
export class DiscordAnswerSlashCommandFunction {
    async run(
        _context: unknown,
        botToken: string,
        interactionToken: string,
        content?: string,
        embed?: DiscordEmbedType
    ): Promise<DiscordMessageType> {
        let webhook: WebhookClient | undefined;

        try {
            const token = interactionToken?.trim();
            if (!token) {
                throw new RuntimeError("DISCORD_MISSING_INTERACTION_TOKEN", "No slash command token was given.");
            }

            // Answering a command means writing to its interaction webhook,
            // which the command token addresses. The bot is only needed for the
            // application the command belongs to.
            const client = await getDiscordClient(botToken);
            const applicationId = client.application?.id;
            if (!applicationId) {
                throw new RuntimeError(
                    "DISCORD_UNKNOWN_APPLICATION",
                    "The Discord bot did not report the application its commands belong to."
                );
            }

            webhook = new WebhookClient({ id: applicationId, token });

            return mapApiMessage(await webhook.editMessage("@original", buildMessagePayload(content, embed)));
        } catch (error) {
            return handleDiscordError(
                error,
                "ERROR_ANSWERING_SLASH_COMMAND",
                "Failed to answer the Discord slash command. Discord closes the answer window 15 minutes after the command was used."
            );
        } finally {
            await webhook?.destroy();
        }
    }
}
