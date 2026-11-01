import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubIssueCommentSchema = schemas["issue-comment"]
export type GitHubIssueComment = z.infer<typeof GitHubIssueCommentSchema>

@Identifier("GITHUB_ISSUE_COMMENT")
@Name({ code: "en-US", content: "GitHub issue comment" })
@DisplayMessage({ code: "en-US", content: "GitHub issue comment" })
@Schema(GitHubIssueCommentSchema)
export class GitHubIssueCommentDataType {}
