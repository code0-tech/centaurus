import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";

@Identifier("createDiscordWebhookUrl")
@Signature("(WebhookId: string, WebhookToken: string): string")
@Name({ code: "en-US", content: "Create Webhook URL" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Create Webhook URL" })
@Documentation({
    code: "en-US",
    content: "Constructs a full Discord webhook URL from a webhook ID and webhook token.",
})
@Description({ code: "en-US", content: "Constructs a full Discord webhook URL from a webhook ID and webhook token." })
@Parameter({
    runtimeName: "WebhookId",
    name: [{ code: "en-US", content: "Webhook ID" }],
    description: [{ code: "en-US", content: "The Discord webhook ID." }],
})
@Parameter({
    runtimeName: "WebhookToken",
    name: [{ code: "en-US", content: "Webhook token" }],
    description: [{ code: "en-US", content: "The Discord webhook security token." }],
})
export class CreateDiscordWebhookUrlFunction {
    run(_context: unknown, WebhookId: string, WebhookToken: string): string {
        return `https://discord.com/api/webhooks/${WebhookId.trim()}/${WebhookToken.trim()}`;
    }
}
