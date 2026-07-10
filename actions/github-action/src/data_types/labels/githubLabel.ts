import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubLabelSchema = z.looseObject({}) as unknown as z.ZodType<Endpoints["GET /repos/{owner}/{repo}/labels"]["response"]["data"][number]>
export type GitHubLabel = z.infer<typeof GitHubLabelSchema>

@Identifier("GITHUB_LABEL")
@Name({ code: "en-US", content: "GitHub label" })
@DisplayMessage({ code: "en-US", content: "GitHub label" })
@Schema(GitHubLabelSchema)
export class GitHubLabelDataType {}
