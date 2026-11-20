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

@Identifier("SlackAppMentioned")
@DisplayIcon("simple:slack")
@Name({code: "en-US", content: "Slack app mentioned"})
@Description({code: "en-US", content: "Triggered when the bot user is @-mentioned in a message (app_mention)."})
@DisplayMessage({code: "en-US", content: "Slack app mentioned on ${http_url}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: SlackAppMentionEventPayload): REST_ADAPTER_INPUT<SlackAppMentionEventPayload>")
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
    defaultValue: "application/json"
})
export class SlackAppMentioned extends Rest {
}
