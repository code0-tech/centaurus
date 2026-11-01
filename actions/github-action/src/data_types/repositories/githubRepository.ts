import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubRepositorySchema = schemas["full-repository"]
export type GitHubRepository = z.infer<typeof GitHubRepositorySchema>

@Identifier("GITHUB_REPOSITORY")
@Name({ code: "en-US", content: "GitHub repository" })
@DisplayMessage({ code: "en-US", content: "GitHub repository" })
@Schema(GitHubRepositorySchema)
export class GitHubRepositoryDataType {}
