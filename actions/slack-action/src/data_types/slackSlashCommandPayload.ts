import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * Payload of a slash command invocation. Unlike Events API deliveries this is
 * not wrapped in an `event_callback` envelope: Slack posts the fields below as
 * `application/x-www-form-urlencoded`.
 * See https://docs.slack.dev/interactivity/implementing-slash-commands
 */
export const SlackSlashCommandPayloadSchema = z.object({
    token: z.string().nullish().describe("The deprecated verification token. Validate the request signature instead."),
    command: z.string().describe("The invoked command including its leading slash, e.g. /deploy."),
    text: z.string().nullish().describe("Everything the user typed after the command name."),
    team_id: z.string().nullish().describe("The ID of the workspace the command was invoked in."),
    team_domain: z.string().nullish().describe("The subdomain of the workspace the command was invoked in."),
    enterprise_id: z.string().nullish().describe("The ID of the Enterprise Grid organization, if any."),
    enterprise_name: z.string().nullish().describe("The name of the Enterprise Grid organization, if any."),
    channel_id: z.string().nullish().describe("The ID of the channel the command was invoked in."),
    channel_name: z.string().nullish().describe("The name of the channel the command was invoked in."),
    user_id: z.string().nullish().describe("The ID of the user who invoked the command."),
    user_name: z.string().nullish().describe("The handle of the user who invoked the command."),
    api_app_id: z.string().nullish().describe("The ID of the Slack app the command belongs to."),
    is_enterprise_install: z.string().nullish().describe("Whether the app is installed org-wide, as the string `true` or `false`."),
    response_url: z.string().nullish().describe("A URL that accepts delayed responses for up to 30 minutes after the invocation."),
    trigger_id: z.string().nullish().describe("A short-lived ID usable to open a modal in response to the command."),
});

@Identifier("SlackSlashCommandPayload")
@Name({ code: "en-US", content: "SlackSlashCommandPayload" })
@Schema(SlackSlashCommandPayloadSchema)
export class SlackSlashCommandPayload {}
