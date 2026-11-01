import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubPullRequestMergeResultSchema = schemas["pull-request-merge-result"]
export type GitHubPullRequestMergeResult = z.infer<typeof GitHubPullRequestMergeResultSchema>

@Identifier("GITHUB_PULL_REQUEST_MERGE_RESULT")
@Name({ code: "en-US", content: "GitHub pull request merge result" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request merge result" })
@Schema(GitHubPullRequestMergeResultSchema)
export class GitHubPullRequestMergeResultDataType {}
