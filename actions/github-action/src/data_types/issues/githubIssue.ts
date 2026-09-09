import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubIssueSchema = z.looseObject({}) as unknown as z.ZodType<Endpoints["GET /repos/{owner}/{repo}/issues/{issue_number}"]["response"]["data"]>
export type GitHubIssue = z.infer<typeof GitHubIssueSchema>

@Identifier("GITHUB_ISSUE")
@Name({ code: "en-US", content: "GitHub issue" })
@DisplayMessage({ code: "en-US", content: "GitHub issue" })
@Schema(GitHubIssueSchema)
export class GitHubIssueDataType {}
