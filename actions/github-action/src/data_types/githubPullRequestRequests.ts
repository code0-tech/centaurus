import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreatePullRequestRequestSchema = z.custom<Omit<Endpoints["POST /repos/{owner}/{repo}/pulls"]["parameters"], "owner" | "repo">>()
export type GitHubCreatePullRequestRequest = z.infer<typeof GitHubCreatePullRequestRequestSchema>

export const GitHubUpdatePullRequestRequestSchema =
    z.custom<Omit<Endpoints["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"]["parameters"], "owner" | "repo" | "pull_number">>()
export type GitHubUpdatePullRequestRequest = z.infer<typeof GitHubUpdatePullRequestRequestSchema>

@Identifier("GITHUB_CREATE_PULL_REQUEST_REQUEST")
@Name({ code: "en-US", content: "Create GitHub pull request request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request request" })
@Schema(GitHubCreatePullRequestRequestSchema)
export class GitHubCreatePullRequestRequestDataType {}

@Identifier("GITHUB_UPDATE_PULL_REQUEST_REQUEST")
@Name({ code: "en-US", content: "Update GitHub pull request request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub pull request request" })
@Schema(GitHubUpdatePullRequestRequestSchema)
export class GitHubUpdatePullRequestRequestDataType {}
