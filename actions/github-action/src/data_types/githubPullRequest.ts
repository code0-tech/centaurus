import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubPullRequestSchema = z.looseObject({}) as unknown as z.ZodType<
    Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"]["data"]
>
export type GitHubPullRequest = z.infer<typeof GitHubPullRequestSchema>

@Identifier("GITHUB_PULL_REQUEST")
@Name({ code: "en-US", content: "GitHub pull request" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request" })
@Schema(GitHubPullRequestSchema)
export class GitHubPullRequestDataType {}
