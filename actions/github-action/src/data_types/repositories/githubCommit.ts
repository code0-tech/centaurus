import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCommitSchema = z.looseObject({}) as unknown as z.ZodType<Endpoints["GET /repos/{owner}/{repo}/commits/{ref}"]["response"]["data"]>
export type GitHubCommit = z.infer<typeof GitHubCommitSchema>

@Identifier("GITHUB_COMMIT")
@Name({ code: "en-US", content: "GitHub commit" })
@DisplayMessage({ code: "en-US", content: "GitHub commit" })
@Schema(GitHubCommitSchema)
export class GitHubCommitDataType {}
