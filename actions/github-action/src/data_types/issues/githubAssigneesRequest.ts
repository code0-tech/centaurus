import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubAddAssigneesRequestSchema = z.object({
    assignees: z.array(z.string()).min(1),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/issues/{issue_number}/assignees"]["parameters"], "owner" | "repo" | "issue_number">>
export type GitHubAddAssigneesRequest = z.infer<typeof GitHubAddAssigneesRequestSchema>

@Identifier("GITHUB_ADD_ASSIGNEES_REQUEST")
@Name({ code: "en-US", content: "Add GitHub assignees request" })
@DisplayMessage({ code: "en-US", content: "Add GitHub assignees request" })
@Schema(GitHubAddAssigneesRequestSchema)
export class GitHubAddAssigneesRequestDataType {}
