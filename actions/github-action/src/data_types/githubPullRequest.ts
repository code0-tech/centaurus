import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import {
    GitHubLabelSchema,
    GitHubMilestoneSchema,
    GitHubRepositoryReferenceSchema,
    GitHubTeamSchema,
    GitHubUserSchema,
} from "./githubCommon.js"

const GitHubPullRequestBranchSchema = z.object({
    label: z.string(),
    ref: z.string(),
    sha: z.string(),
    user: GitHubUserSchema,
    repo: GitHubRepositoryReferenceSchema.nullable(),
})

export const GitHubPullRequestSchema = z.object({
    id: z.int(),
    node_id: z.string(),
    url: z.url(),
    html_url: z.url(),
    diff_url: z.url(),
    patch_url: z.url(),
    issue_url: z.url(),
    commits_url: z.url(),
    review_comments_url: z.string(),
    review_comment_url: z.string(),
    comments_url: z.url(),
    statuses_url: z.url(),
    number: z.int().positive(),
    state: z.enum(["open", "closed"]),
    locked: z.boolean(),
    title: z.string(),
    body: z.string().nullable(),
    user: GitHubUserSchema.nullable(),
    labels: z.array(GitHubLabelSchema),
    milestone: GitHubMilestoneSchema.nullable(),
    active_lock_reason: z.string().nullable().optional(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
    closed_at: z.iso.datetime().nullable(),
    merged_at: z.iso.datetime().nullable(),
    merge_commit_sha: z.string().nullable(),
    assignee: GitHubUserSchema.nullable(),
    assignees: z.array(GitHubUserSchema),
    requested_reviewers: z.array(GitHubUserSchema),
    requested_teams: z.array(GitHubTeamSchema),
    head: GitHubPullRequestBranchSchema,
    base: GitHubPullRequestBranchSchema,
    author_association: z.string(),
    draft: z.boolean().nullable(),
})
export type GitHubPullRequest = z.infer<typeof GitHubPullRequestSchema>

@Identifier("GITHUB_PULL_REQUEST")
@Name({ code: "en-US", content: "GitHub pull request" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request" })
@Schema(GitHubPullRequestSchema)
export class GitHubPullRequestDataType {}
