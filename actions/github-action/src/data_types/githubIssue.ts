import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { GitHubLabelSchema, GitHubMilestoneSchema, GitHubUserSchema } from "./githubCommon.js"

export const GitHubIssueSchema = z.object({
    id: z.int(),
    node_id: z.string(),
    url: z.url(),
    repository_url: z.url(),
    labels_url: z.string(),
    comments_url: z.url(),
    events_url: z.url(),
    html_url: z.url(),
    number: z.int().positive(),
    state: z.enum(["open", "closed"]),
    state_reason: z.enum(["completed", "not_planned", "reopened"]).nullable(),
    title: z.string(),
    body: z.string().nullable(),
    user: GitHubUserSchema.nullable(),
    labels: z.array(GitHubLabelSchema),
    assignee: GitHubUserSchema.nullable(),
    assignees: z.array(GitHubUserSchema),
    milestone: GitHubMilestoneSchema.nullable(),
    locked: z.boolean(),
    active_lock_reason: z.string().nullable().optional(),
    comments: z.int().nonnegative(),
    author_association: z.string(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
    closed_at: z.iso.datetime().nullable(),
})
export type GitHubIssue = z.infer<typeof GitHubIssueSchema>

@Identifier("GITHUB_ISSUE")
@Name({ code: "en-US", content: "GitHub issue" })
@DisplayMessage({ code: "en-US", content: "GitHub issue" })
@Schema(GitHubIssueSchema)
export class GitHubIssueDataType {}
