import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubReleaseSchema = schemas["release"]
export type GitHubRelease = z.infer<typeof GitHubReleaseSchema>

@Identifier("GITHUB_RELEASE")
@Name({ code: "en-US", content: "GitHub release" })
@DisplayMessage({ code: "en-US", content: "GitHub release" })
@Schema(GitHubReleaseSchema)
export class GitHubReleaseDataType {}
