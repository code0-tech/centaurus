import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubCommitStatusSchema = schemas["status"]
export type GitHubCommitStatus = z.infer<typeof GitHubCommitStatusSchema>

export const GitHubCheckRunSchema = schemas["check-run"]
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
