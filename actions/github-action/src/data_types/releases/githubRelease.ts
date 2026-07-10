import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubReleaseSchema = z.looseObject({}) as unknown as z.ZodType<Endpoints["GET /repos/{owner}/{repo}/releases/{release_id}"]["response"]["data"]>
export type GitHubRelease = z.infer<typeof GitHubReleaseSchema>

@Identifier("GITHUB_RELEASE")
@Name({ code: "en-US", content: "GitHub release" })
@DisplayMessage({ code: "en-US", content: "GitHub release" })
@Schema(GitHubReleaseSchema)
export class GitHubReleaseDataType {}
