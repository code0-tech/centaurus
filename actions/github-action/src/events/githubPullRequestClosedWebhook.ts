import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules"

@Identifier("GitHubPullRequestClosedWebhook")
@DisplayIcon("tabler:brand-github")
@Name({ code: "en-US", content: "GitHub pull request closed" })
@Description({ code: "en-US", content: "Triggered when a GitHub pull request is closed." })
@DisplayMessage({ code: "en-US", content: "GitHub pull request closed on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, owner?: TEXT, repository?: TEXT, assignee?: TEXT, input_schema?: githubPullRequestClosedWebhookPayload): REST_ADAPTER_INPUT<githubPullRequestClosedWebhookPayload>")
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
export class GitHubPullRequestClosedWebhook extends Rest {}
