import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

/**
 * Delivered over Slack Socket Mode by {@link SlackSocketManager}, not over HTTP.
 */
@Identifier("SlackReactionAdded")
@DisplayIcon("tabler:brand-slack")
@Name({ code: "en-US", content: "Slack reaction added" })
@Description({ code: "en-US", content: "Triggered when a member adds an emoji reaction to a message or file (reaction_added). Use it to drive approval and reaction-role flows." })
@DisplayMessage({ code: "en-US", content: "Slack reaction added" })
@Signature("(channelId?: TEXT, messageTs?: TEXT): SlackReactionAddedEventPayload")
@EventSetting({
    identifier: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [
        {
            code: "en-US",
            content: "Only trigger for the channel of the message reacted to, e.g. C0123456789. Leave empty to trigger for every channel.",
        },
    ],
    linkedDataTypeIdentifiers: ["TEXT"],
    optional: true,
})
@EventSetting({
    identifier: "messageTs",
    name: [{ code: "en-US", content: "Message" }],
    description: [
        {
            code: "en-US",
            content:
                "Only trigger for reactions to this message. Enter its timestamp (e.g. 1712345678.123456) or paste its link from Slack (Copy link). Leave empty to trigger for every message.",
        },
    ],
    linkedDataTypeIdentifiers: ["TEXT"],
    optional: true,
})
export class SlackReactionAdded {}
