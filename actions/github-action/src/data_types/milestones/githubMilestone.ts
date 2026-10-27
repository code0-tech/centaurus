import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubMilestoneSchema = schemas["milestone"]
export type GitHubMilestone = z.infer<typeof GitHubMilestoneSchema>

@Identifier("GITHUB_MILESTONE")
@Name({ code: "en-US", content: "GitHub milestone" })
@DisplayMessage({ code: "en-US", content: "GitHub milestone" })
@Schema(GitHubMilestoneSchema)
export class GitHubMilestoneDataType {}
