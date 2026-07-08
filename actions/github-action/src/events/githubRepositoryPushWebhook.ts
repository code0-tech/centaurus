import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules"

@Identifier("GitHubRepositoryPushWebhook")
@DisplayIcon("tabler:brand-github")
@Name({ code: "en-US", content: "GitHub repository push" })
@Description({ code: "en-US", content: "Triggered when commits or tags are pushed to a GitHub repository." })
@DisplayMessage({ code: "en-US", content: "GitHub repository push on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, owner: TEXT, repository: TEXT, input_schema?: githubPush): REST_ADAPTER_INPUT<githubPush>")
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
    description: [{ code: "en-US", content: "GitHub user or organization that owns the repository." }],
})
@EventSetting({
    identifier: "repository",
    linkedDataTypeIdentifiers: ["TEXT"],
    name: [{ code: "en-US", content: "Repository" }],
    description: [{ code: "en-US", content: "GitHub repository name." }],
})
export class GitHubRepositoryPushWebhook extends Rest {}
