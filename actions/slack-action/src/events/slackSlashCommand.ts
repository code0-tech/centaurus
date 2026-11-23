import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

/**
 * Delivered over Slack Socket Mode by {@link SlackSocketManager}, not over HTTP.
 */
@Identifier("SlackSlashCommand")
@DisplayIcon("tabler:brand-slack")
@Name({ code: "en-US", content: "Slack slash command" })
@Description({ code: "en-US", content: "Triggered when one of the app's slash commands is invoked. Reply by posting to the payload's response_url or with slackPostMessage." })
@DisplayMessage({ code: "en-US", content: "Slack slash command" })
@Signature("(channelId?: TEXT): SlackSlashCommandPayload")
@EventSetting({
    identifier: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [
        {
            code: "en-US",
            content: "Only trigger for the channel the command was invoked in, e.g. C0123456789. Leave empty to trigger for every channel.",
        },
    ],
    linkedDataTypeIdentifiers: ["TEXT"],
    optional: true,
})
export class SlackSlashCommand {}
