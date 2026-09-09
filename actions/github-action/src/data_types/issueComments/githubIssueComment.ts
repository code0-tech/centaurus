import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubIssueCommentSchema = z.looseObject({}) as unknown as z.ZodType<
    Endpoints["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"]["response"]["data"]
>
export type GitHubIssueComment = z.infer<typeof GitHubIssueCommentSchema>

@Identifier("GITHUB_ISSUE_COMMENT")
@Name({ code: "en-US", content: "GitHub issue comment" })
@DisplayMessage({ code: "en-US", content: "GitHub issue comment" })
@Schema(GitHubIssueCommentSchema)
export class GitHubIssueCommentDataType {}
