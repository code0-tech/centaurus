import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * The action holds no credentials of its own: every function and every trigger
 * takes the token it works with as its first parameter, so one running action
 * serves as many Slack apps as its flows use. Functions and triggers need
 * different tokens, so each gets its own token type - a single text value.
 */

/** The credential of every Slack function: the bot token for the Web API. */
export const SlackBotTokenSchema = z
    .string()
    .describe(
        "The bot user OAuth token (xoxb-...) used for the Slack Web API. Find it under OAuth & Permissions in your Slack app."
    );
export type SlackBotToken = z.infer<typeof SlackBotTokenSchema>;

/** The credential of every Slack trigger: the app token for Socket Mode. */
export const SlackAppTokenSchema = z
    .string()
    .describe(
        "The app-level token (xapp-...) with the connections:write scope, used to receive events over Socket Mode. Create it under Basic Information > App-Level Tokens and enable Socket Mode in your Slack app."
    );
export type SlackAppToken = z.infer<typeof SlackAppTokenSchema>;

@Identifier("SLACK_BOT_TOKEN")
@Name({ code: "en-US", content: "Slack bot token" })
@DisplayMessage({ code: "en-US", content: "Slack bot token" })
@Schema(SlackBotTokenSchema)
export class SlackBotTokenDataType {}

@Identifier("SLACK_APP_TOKEN")
@Name({ code: "en-US", content: "Slack app token" })
@DisplayMessage({ code: "en-US", content: "Slack app token" })
@Schema(SlackAppTokenSchema)
export class SlackAppTokenDataType {}

/** The first parameter of every Slack function. */
export const BOT_TOKEN_PARAMETER = {
    runtimeName: "botToken",
    name: [{ code: "en-US", content: "Slack bot token" }],
    description: [{ code: "en-US", content: "The bot token (xoxb-...) of the Slack app to use." }],
};
