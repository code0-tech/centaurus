import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubPullRequestMergeResultSchema = z.looseObject({}) as unknown as z.ZodType<
    Endpoints["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"]["response"]["data"]
>
export type GitHubPullRequestMergeResult = z.infer<typeof GitHubPullRequestMergeResultSchema>

export const GitHubPullRequestMergeRequestSchema = z.object({
    commit_title: z.string().optional(),
    commit_message: z.string().optional(),
    sha: z.string().optional(),
    merge_method: z.enum(["merge", "squash", "rebase"]).optional(),
}) as unknown as z.ZodType<Omit<Endpoints["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"]["parameters"], "owner" | "repo" | "pull_number">>
export type GitHubPullRequestMergeRequest = z.infer<typeof GitHubPullRequestMergeRequestSchema>

@Identifier("GITHUB_PULL_REQUEST_MERGE_RESULT")
@Name({ code: "en-US", content: "GitHub pull request merge result" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request merge result" })
@Schema(GitHubPullRequestMergeResultSchema)
export class GitHubPullRequestMergeResultDataType {}

@Identifier("GITHUB_PULL_REQUEST_MERGE_REQUEST")
@Name({ code: "en-US", content: "GitHub pull request merge request" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request merge request" })
@Schema(GitHubPullRequestMergeRequestSchema)
export class GitHubPullRequestMergeRequestDataType {}
