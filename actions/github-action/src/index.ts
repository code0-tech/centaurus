import "reflect-metadata"
import { Action, CodeZeroEvent } from "@code0-tech/hercules"
import { GitHubIssueDataType } from "./data_types/githubIssue.js"
import { GitHubCreateIssueRequestDataType, GitHubUpdateIssueRequestDataType } from "./data_types/githubIssueRequests.js"
import { GitHubPullRequestDataType } from "./data_types/githubPullRequest.js"
// import { GitHubPushWebhookPayloadDataType } from "./data_types/githubPush.js"
import { GitHubCreatePullRequestRequestDataType, GitHubUpdatePullRequestRequestDataType } from "./data_types/githubPullRequestRequests.js"
import { GitHubRepositoryDataType } from "./data_types/githubRepository.js"
// import { GitHubIssueClosedWebhookPayloadDataType } from "./data_types/githubIssueClosedWebhookPayload.js"
// import { GitHubIssueOpenedWebhookPayloadDataType } from "./data_types/githubIssueOpenedWebhookPayload.js"
// import { GitHubPullRequestClosedWebhookPayloadDataType } from "./data_types/githubPullRequestClosedWebhookPayload.js"
// import { GitHubPullRequestOpenedWebhookPayloadDataType } from "./data_types/githubPullRequestOpenedWebhookPayload.js"
import { CreateIssueFunction } from "./functions/issues/createIssueFunction.js"
import { GetIssueFunction } from "./functions/issues/getIssueFunction.js"
import { GetIssuesFunction } from "./functions/issues/getIssuesFunction.js"
import { UpdateIssueFunction } from "./functions/issues/updateIssueFunction.js"
import { CreatePullRequestFunction } from "./functions/pullRequests/createPullRequestFunction.js"
import { GetPullRequestFunction } from "./functions/pullRequests/getPullRequestFunction.js"
import { GetPullRequestsFunction } from "./functions/pullRequests/getPullRequestsFunction.js"
import { UpdatePullRequestFunction } from "./functions/pullRequests/updatePullRequestFunction.js"
import { GetRepositoryFunction } from "./functions/repositories/getRepositoryFunction.js"
// import { GitHubIssueClosedWebhook } from "./events/githubIssueClosedWebhook.js"
// import { GitHubIssueOpenedWebhook } from "./events/githubIssueOpenedWebhook.js"
// import { GitHubPullRequestClosedWebhook } from "./events/githubPullRequestClosedWebhook.js"
// import { GitHubPullRequestOpenedWebhook } from "./events/githubPullRequestOpenedWebhook.js"
// import { GitHubRepositoryPushWebhook } from "./events/githubRepositoryPushWebhook.js"

const action = new Action(
    process.env.ACTION_ID ?? "github-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "tabler:brand-github",
    "GitHub integration for retrieving repositories, issues, and pull requests.",
    [{ code: "en-US", content: "GitHub Action" }],
    [
        {
            identifier: "github_token",
            type: "TEXT",
            name: [{ code: "en-US", content: "GitHub token" }],
            description: [
                {
                    code: "en-US",
                    content: "Fine-grained GitHub access token used to authenticate API requests.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "github_api_url",
            type: "TEXT",
            defaultValue: "https://api.github.com",
            name: [{ code: "en-US", content: "GitHub API URL" }],
            description: [
                {
                    code: "en-US",
                    content: "Base URL of the GitHub REST API.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
)

action.registerDataTypeClass(GitHubRepositoryDataType)
action.registerDataTypeClass(GitHubIssueDataType)
action.registerDataTypeClass(GitHubCreateIssueRequestDataType)
action.registerDataTypeClass(GitHubUpdateIssueRequestDataType)
action.registerDataTypeClass(GitHubPullRequestDataType)
// action.registerDataTypeClass(GitHubPushWebhookPayloadDataType)
action.registerDataTypeClass(GitHubCreatePullRequestRequestDataType)
action.registerDataTypeClass(GitHubUpdatePullRequestRequestDataType)
// action.registerDataTypeClass(GitHubIssueOpenedWebhookPayloadDataType)
// action.registerDataTypeClass(GitHubIssueClosedWebhookPayloadDataType)
// action.registerDataTypeClass(GitHubPullRequestOpenedWebhookPayloadDataType)
// action.registerDataTypeClass(GitHubPullRequestClosedWebhookPayloadDataType)

action.registerRuntimeFunction(GetRepositoryFunction)
action.registerRuntimeFunction(GetIssueFunction)
action.registerRuntimeFunction(GetIssuesFunction)
action.registerRuntimeFunction(GetPullRequestFunction)
action.registerRuntimeFunction(GetPullRequestsFunction)
action.registerRuntimeFunction(CreateIssueFunction)
action.registerRuntimeFunction(UpdateIssueFunction)
action.registerRuntimeFunction(CreatePullRequestFunction)
action.registerRuntimeFunction(UpdatePullRequestFunction)

// action.registerEventClass(GitHubRepositoryPushWebhook)
// action.registerEventClass(GitHubPullRequestOpenedWebhook)
// action.registerEventClass(GitHubPullRequestClosedWebhook)
// action.registerEventClass(GitHubIssueOpenedWebhook)
// action.registerEventClass(GitHubIssueClosedWebhook)

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to Aquila")
})

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message)
    console.log("Attempting to reconnect in 5s...")

    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "token_abc1234").catch((reconnectError: unknown) => {
            console.error("Reconnect failed:", reconnectError)
        })
    }, 5000)
})

action.connect(process.env.AUTH_TOKEN ?? "token_abc1234").catch((error: unknown) => {
    console.error("Failed to connect:", error)
    process.exit(1)
})

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, { depth: null })
    console.dir(action.configs.values(), { depth: null })
})

export { action }
