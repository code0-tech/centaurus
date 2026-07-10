import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubIssueLabelsRequestSchema = z.object({
    labels: z.array(z.string()).min(1),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"]["parameters"], "owner" | "repo" | "issue_number">>
export type GitHubIssueLabelsRequest = z.infer<typeof GitHubIssueLabelsRequestSchema>

@Identifier("GITHUB_ISSUE_LABELS_REQUEST")
@Name({ code: "en-US", content: "GitHub issue labels request" })
@DisplayMessage({ code: "en-US", content: "GitHub issue labels request" })
@Schema(GitHubIssueLabelsRequestSchema)
export class GitHubIssueLabelsRequestDataType {}
