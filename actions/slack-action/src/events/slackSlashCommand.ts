import {
    Description,
    DisplayIcon,
    DisplayMessage,
    EventSetting,
    Identifier,
    Name,
    Rest,
    Signature,
} from "@code0-tech/hercules";

@Identifier("SlackSlashCommand")
@DisplayIcon("simple:slack")
@Name({code: "en-US", content: "Slack slash command"})
@Description({code: "en-US", content: "Triggered when a registered slash command is invoked. Compare event.command against the command you registered for this endpoint."})
@DisplayMessage({code: "en-US", content: "Slack slash command on ${http_url}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: SlackSlashCommandPayload): REST_ADAPTER_INPUT<SlackSlashCommandPayload>")
@EventSetting({
    identifier: "input_schema",
    hidden: true
})
@EventSetting({
    identifier: "http_method",
    hidden: true,
    defaultValue: "POST"
})
@EventSetting({
    identifier: "http_schema",
    hidden: true,
    defaultValue: "application/x-www-form-urlencoded"
})
export class SlackSlashCommand extends Rest {
}
