import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreateIssueRequestSchema = z.custom<Omit<Endpoints["POST /repos/{owner}/{repo}/issues"]["parameters"], "owner" | "repo">>()
export type GitHubCreateIssueRequest = z.infer<typeof GitHubCreateIssueRequestSchema>

export const GitHubUpdateIssueRequestSchema =
    z.custom<Omit<Endpoints["PATCH /repos/{owner}/{repo}/issues/{issue_number}"]["parameters"], "owner" | "repo" | "issue_number">>()
export type GitHubUpdateIssueRequest = z.infer<typeof GitHubUpdateIssueRequestSchema>

@Identifier("GITHUB_CREATE_ISSUE_REQUEST")
@Name({ code: "en-US", content: "Create GitHub issue request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub issue request" })
@Schema(GitHubCreateIssueRequestSchema)
export class GitHubCreateIssueRequestDataType {}

@Identifier("GITHUB_UPDATE_ISSUE_REQUEST")
@Name({ code: "en-US", content: "Update GitHub issue request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub issue request" })
@Schema(GitHubUpdateIssueRequestSchema)
export class GitHubUpdateIssueRequestDataType {}
