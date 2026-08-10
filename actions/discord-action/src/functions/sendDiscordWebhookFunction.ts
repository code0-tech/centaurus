import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { DiscordEmbedData } from "../data_types/discordEmbed.js";
import { DiscordWebhookResponseData } from "../data_types/discordWebhook.js";
import { sendDiscordWebhook } from "../helpers.js";

@Identifier("sendDiscordWebhook")
@Signature("(WebhookUrl?: string, Content?: string, Embed?: DISCORD_EMBED, Username?: string, AvatarUrl?: string, TTS?: boolean): DISCORD_WEBHOOK_RESPONSE")
@Name({ code: "en-US", content: "Send Webhook" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Send Webhook" })
@Documentation({
    code: "en-US",
    content: "Sends a message with optional text content and rich embed to a Discord Webhook URL. Webhook URL, Username, and Avatar URL fall back to action configuration if not specified.",
})
@Description({ code: "en-US", content: "Sends a Discord Webhook message." })
@Parameter({
    runtimeName: "WebhookUrl",
    name: [{ code: "en-US", content: "Webhook URL" }],
    description: [{ code: "en-US", content: "The full Discord webhook URL. Falls back to action config if empty." }],
})
@Parameter({
    runtimeName: "Content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "Text content of the message." }],
})
@Parameter({
    runtimeName: "Embed",
    name: [{ code: "en-US", content: "Embed" }],
    description: [{ code: "en-US", content: "Single Discord embed object created with Create Embed." }],
})
@Parameter({
    runtimeName: "Username",
    name: [{ code: "en-US", content: "Username" }],
    description: [{ code: "en-US", content: "Custom username for the webhook. Falls back to action config if empty." }],
})
@Parameter({
    runtimeName: "AvatarUrl",
    name: [{ code: "en-US", content: "Avatar URL" }],
    description: [{ code: "en-US", content: "Custom avatar URL for the webhook. Falls back to action config if empty." }],
})
@Parameter({
    runtimeName: "TTS",
    name: [{ code: "en-US", content: "TTS" }],
    description: [{ code: "en-US", content: "Send as text-to-speech message." }],
})
export class SendDiscordWebhookFunction {
    async run(
        context: FunctionContext,
        WebhookUrl?: string,
        Content?: string,
        Embed?: DiscordEmbedData,
        Username?: string,
        AvatarUrl?: string,
        TTS?: boolean
    ): Promise<DiscordWebhookResponseData> {
        try {
            return await sendDiscordWebhook(context, WebhookUrl, Content, Embed, Username, AvatarUrl, TTS);
        } catch (error: any) {
            if (typeof error === "string") {
                throw new RuntimeError("ERROR_SENDING_DISCORD_WEBHOOK", error);
            }
            throw new RuntimeError(
                "ERROR_SENDING_DISCORD_WEBHOOK",
                error?.message || "An error occurred while sending the Discord webhook."
            );
        }
    }
}
