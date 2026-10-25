import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubPullRequestSchema = schemas["pull-request"]
export type GitHubPullRequest = z.infer<typeof GitHubPullRequestSchema>

@Identifier("GITHUB_PULL_REQUEST")
@Name({ code: "en-US", content: "GitHub pull request" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request" })
@Schema(GitHubPullRequestSchema)
export class GitHubPullRequestDataType {}

/** The pull request list endpoint returns fewer fields than the single pull request endpoint. */
export const GitHubPullRequestSummarySchema = schemas["pull-request-simple"]
export type GitHubPullRequestSummary = z.infer<typeof GitHubPullRequestSummarySchema>

@Identifier("GITHUB_PULL_REQUEST_SUMMARY")
@Name({ code: "en-US", content: "GitHub pull request summary" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request summary" })
@Schema(GitHubPullRequestSummarySchema)
export class GitHubPullRequestSummaryDataType {}
