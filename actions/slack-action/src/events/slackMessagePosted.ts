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

@Identifier("SlackMessagePosted")
@DisplayIcon("simple:slack")
@Name({code: "en-US", content: "Slack message posted"})
@Description({code: "en-US", content: "Triggered when a message is posted in a public channel the Slack app is a member of (message.channels). Compare event.channel against the channel you want to watch."})
@DisplayMessage({code: "en-US", content: "Slack message posted on ${http_url}"})
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: SlackMessagePostedEventPayload): REST_ADAPTER_INPUT<SlackMessagePostedEventPayload>")
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
export class SlackMessagePosted extends Rest {
}
