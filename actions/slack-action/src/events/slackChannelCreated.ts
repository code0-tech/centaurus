import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Signature } from "@code0-tech/hercules";

/**
 * Delivered over Slack Socket Mode by {@link SlackSocketManager}, not over HTTP.
 */
@Identifier("SlackChannelCreated")
@DisplayIcon("tabler:brand-slack")
@Name({ code: "en-US", content: "Slack channel created" })
@Description({ code: "en-US", content: "Triggered when a new public channel is created in the workspace (channel_created)." })
@DisplayMessage({ code: "en-US", content: "Slack channel created" })
@Signature("(): SlackChannelCreatedEventPayload")
export class SlackChannelCreated {}
