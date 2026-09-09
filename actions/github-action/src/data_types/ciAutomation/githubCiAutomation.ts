import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCommitStatusSchema = z.looseObject({}) as unknown as z.ZodType<Endpoints["POST /repos/{owner}/{repo}/statuses/{sha}"]["response"]["data"]>
export type GitHubCommitStatus = z.infer<typeof GitHubCommitStatusSchema>

export const GitHubCheckRunSchema = z.looseObject({}) as unknown as z.ZodType<Endpoints["POST /repos/{owner}/{repo}/check-runs"]["response"]["data"]>
export type GitHubCheckRun = z.infer<typeof GitHubCheckRunSchema>

@Identifier("GITHUB_COMMIT_STATUS")
@Name({ code: "en-US", content: "GitHub commit status" })
@DisplayMessage({ code: "en-US", content: "GitHub commit status" })
@Schema(GitHubCommitStatusSchema)
export class GitHubCommitStatusDataType {}

@Identifier("GITHUB_CHECK_RUN")
@Name({ code: "en-US", content: "GitHub check run" })
@DisplayMessage({ code: "en-US", content: "GitHub check run" })
@Schema(GitHubCheckRunSchema)
export class GitHubCheckRunDataType {}
