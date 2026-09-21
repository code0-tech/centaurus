import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubMilestoneSchema = z.looseObject({}) as unknown as z.ZodType<
    Endpoints["GET /repos/{owner}/{repo}/milestones/{milestone_number}"]["response"]["data"]
>
export type GitHubMilestone = z.infer<typeof GitHubMilestoneSchema>

@Identifier("GITHUB_MILESTONE")
@Name({ code: "en-US", content: "GitHub milestone" })
@DisplayMessage({ code: "en-US", content: "GitHub milestone" })
@Schema(GitHubMilestoneSchema)
export class GitHubMilestoneDataType {}
