import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules"

@Identifier("GitHubPullRequestOpenedWebhook")
@DisplayIcon("tabler:brand-github")
@Name({ code: "en-US", content: "GitHub pull request opened" })
@Description({ code: "en-US", content: "Triggered when a GitHub pull request is opened." })
@DisplayMessage({ code: "en-US", content: "GitHub pull request opened on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, owner?: TEXT, repository?: TEXT, assignee?: TEXT, input_schema?: githubPullRequestOpenedWebhookPayload): REST_ADAPTER_INPUT<githubPullRequestOpenedWebhookPayload>")
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
@EventSetting({
    identifier: "owner",
    linkedDataTypeIdentifiers: ["TEXT"],
    name: [{ code: "en-US", content: "Repository owner" }],
    description: [{ code: "en-US", content: "Optional GitHub user or organization that owns the repository." }],
    optional: true,
})
@EventSetting({
    identifier: "repository",
    linkedDataTypeIdentifiers: ["TEXT"],
    name: [{ code: "en-US", content: "Repository" }],
    description: [{ code: "en-US", content: "Optional GitHub repository name." }],
    optional: true,
})
@EventSetting({
    identifier: "assignee",
    linkedDataTypeIdentifiers: ["TEXT"],
    name: [{ code: "en-US", content: "Assignee" }],
    description: [{ code: "en-US", content: "Optional GitHub login assigned to pull requests that should trigger the event." }],
    optional: true,
})
export class GitHubPullRequestOpenedWebhook extends Rest {}
