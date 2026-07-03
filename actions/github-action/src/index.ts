import "reflect-metadata"
import { Action, CodeZeroEvent } from "@code0-tech/hercules"

import { GitHubIssueDataType } from "./data_types/githubIssue.js"
import {
    GitHubCreateIssueRequestDataType,
    GitHubUpdateIssueRequestDataType,
} from "./data_types/githubIssueRequests.js"
import { GitHubPullRequestDataType } from "./data_types/githubPullRequest.js"
import {
    GitHubCreatePullRequestRequestDataType,
    GitHubUpdatePullRequestRequestDataType,
} from "./data_types/githubPullRequestRequests.js"
import { GitHubRepositoryDataType } from "./data_types/githubRepository.js"
import { CreateIssueFunction } from "./functions/createIssueFunction.js"
import { CreatePullRequestFunction } from "./functions/createPullRequestFunction.js"
import { GetIssueFunction } from "./functions/getIssueFunction.js"
import { GetIssuesFunction } from "./functions/getIssuesFunction.js"
import { GetPullRequestFunction } from "./functions/getPullRequestFunction.js"
import { GetPullRequestsFunction } from "./functions/getPullRequestsFunction.js"
import { GetRepositoryFunction } from "./functions/getRepositoryFunction.js"
import { UpdateIssueFunction } from "./functions/updateIssueFunction.js"
import { UpdatePullRequestFunction } from "./functions/updatePullRequestFunction.js"

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
action.registerDataTypeClass(GitHubCreatePullRequestRequestDataType)
action.registerDataTypeClass(GitHubUpdatePullRequestRequestDataType)

action.registerRuntimeFunction(GetRepositoryFunction)
action.registerRuntimeFunction(GetIssueFunction)
action.registerRuntimeFunction(GetIssuesFunction)
action.registerRuntimeFunction(GetPullRequestFunction)
action.registerRuntimeFunction(GetPullRequestsFunction)
action.registerRuntimeFunction(CreateIssueFunction)
action.registerRuntimeFunction(UpdateIssueFunction)
action.registerRuntimeFunction(CreatePullRequestFunction)
action.registerRuntimeFunction(UpdatePullRequestFunction)

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to Aquila")
})

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message)
    console.log("Attempting to reconnect in 5s...")

    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((reconnectError: unknown) => {
            console.error("Reconnect failed:", reconnectError)
        })
    }, 5000)
})

action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((error: unknown) => {
    console.error("Failed to connect:", error)
    process.exit(1)
})

export { action }
