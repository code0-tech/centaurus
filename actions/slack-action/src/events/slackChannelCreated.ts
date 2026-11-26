import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

/**
 * Delivered over Slack Socket Mode by {@link SlackSocketManager}, not over HTTP.
 */
@Identifier("SlackChannelCreated")
@DisplayIcon("tabler:brand-slack")
@Name({ code: "en-US", content: "Slack channel created" })
@Description({ code: "en-US", content: "Triggered when a new public channel is created in the workspace (channel_created)." })
@DisplayMessage({ code: "en-US", content: "Slack channel created" })
@Signature("(appToken: SLACK_APP_TOKEN): SlackChannelCreatedEventPayload")
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
export class SlackChannelCreated {}
