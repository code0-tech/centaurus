import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

/**
 * Delivered over Slack Socket Mode by {@link SlackSocketManager}, not over HTTP.
 */
@Identifier("SlackAppMentioned")
@DisplayIcon("tabler:brand-slack")
@Name({ code: "en-US", content: "Slack app mentioned" })
@Description({ code: "en-US", content: "Triggered when the bot user is @-mentioned in a message (app_mention)." })
@DisplayMessage({ code: "en-US", content: "Slack app mentioned" })
@Signature("(appToken: SLACK_APP_TOKEN, channelId?: TEXT): SlackAppMentionEventPayload")
@EventSetting({
    identifier: "appToken",
    name: [{ code: "en-US", content: "Slack app token" }],
    description: [
        {
            code: "en-US",
            content: "The app token (xapp-...) of the Slack app to listen with. Events arrive over Socket Mode.",
        },
    ],
    linkedDataTypeIdentifiers: ["SLACK_APP_TOKEN"],
})
@EventSetting({
    identifier: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [
        {
            code: "en-US",
            content: "Only trigger for the channel the mention was posted in, e.g. C0123456789. Leave empty to trigger for every channel.",
        },
    ],
    linkedDataTypeIdentifiers: ["TEXT"],
    optional: true,
})
export class SlackAppMentioned {}
