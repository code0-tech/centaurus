import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubRepositorySchema = z.looseObject({}) as unknown as z.ZodType<Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"]>
export type GitHubRepository = z.infer<typeof GitHubRepositorySchema>

@Identifier("GITHUB_REPOSITORY")
@Name({ code: "en-US", content: "GitHub repository" })
@DisplayMessage({ code: "en-US", content: "GitHub repository" })
@Schema(GitHubRepositorySchema)
export class GitHubRepositoryDataType {}
