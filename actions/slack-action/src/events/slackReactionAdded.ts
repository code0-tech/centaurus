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

@Identifier("SlackReactionAdded")
@DisplayIcon("simple:slack")
@Name({code: "en-US", content: "Slack reaction added"})
@Description({code: "en-US", content: "Triggered when a member adds an emoji reaction to a message or file (reaction_added). Use it to drive approval and reaction-role flows."})
@DisplayMessage({code: "en-US", content: "Slack reaction added on ${http_url}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: SlackReactionAddedEventPayload): REST_ADAPTER_INPUT<SlackReactionAddedEventPayload>")
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
export class SlackReactionAdded extends Rest {
}
