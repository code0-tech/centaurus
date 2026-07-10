import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules"

@Identifier("GitHubIssueClosedWebhook")
@DisplayIcon("tabler:brand-github")
@Name({ code: "en-US", content: "GitHub issue closed" })
@Description({ code: "en-US", content: "Triggered when a GitHub issue is closed." })
@DisplayMessage({ code: "en-US", content: "GitHub issue closed on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: GitHubIssueClosedWebhookPayload): REST_ADAPTER_INPUT<GitHubIssueClosedWebhookPayload>")
@EventSetting({
    identifier: "input_schema",
    hidden: true,
})
@EventSetting({
    identifier: "httpMethod",
    hidden: true,
    defaultValue: "POST",
})
@EventSetting({
    identifier: "httpSchema",
    hidden: true,
    defaultValue: "application/json",
})
export class GitHubIssueClosedWebhook extends Rest {}
