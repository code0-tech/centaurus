import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubCommitSchema = schemas["commit"]
export type GitHubCommit = z.infer<typeof GitHubCommitSchema>

@Identifier("GITHUB_COMMIT")
@Name({ code: "en-US", content: "GitHub commit" })
@DisplayMessage({ code: "en-US", content: "GitHub commit" })
@Schema(GitHubCommitSchema)
export class GitHubCommitDataType {}
