import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubIssueSchema = schemas["issue"]
export type GitHubIssue = z.infer<typeof GitHubIssueSchema>

@Identifier("GITHUB_ISSUE")
@Name({ code: "en-US", content: "GitHub issue" })
@DisplayMessage({ code: "en-US", content: "GitHub issue" })
@Schema(GitHubIssueSchema)
export class GitHubIssueDataType {}
