import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules"

@Identifier("GitHubPullRequestOpenedWebhook")
@DisplayIcon("tabler:brand-github")
@Name({ code: "en-US", content: "GitHub pull request opened" })
@Description({ code: "en-US", content: "Triggered when a GitHub pull request is opened." })
@DisplayMessage({ code: "en-US", content: "GitHub pull request opened on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: GitHubPullRequestOpenedWebhookPayload): REST_ADAPTER_INPUT<GitHubPullRequestOpenedWebhookPayload>")
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
export class GitHubPullRequestOpenedWebhook extends Rest {}
