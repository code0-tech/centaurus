import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

/**
 * Delivered over Slack Socket Mode by {@link SlackSocketManager}, not over HTTP.
 */
@Identifier("SlackMessagePosted")
@DisplayIcon("tabler:brand-slack")
@Name({ code: "en-US", content: "Slack message posted" })
@Description({ code: "en-US", content: "Triggered when someone posts a message in a channel the Slack app is a member of (message). Edits, deletions, join notices and messages sent by bots, including this app, are skipped." })
@DisplayMessage({ code: "en-US", content: "Slack message posted" })
@Signature("(appToken: SLACK_APP_TOKEN, channelId?: TEXT): SlackMessagePostedEventPayload")
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
            content: "Only trigger for the channel the message was posted in, e.g. C0123456789. Leave empty to trigger for every channel.",
        },
    ],
    linkedDataTypeIdentifiers: ["TEXT"],
    optional: true,
})
export class SlackMessagePosted {}
