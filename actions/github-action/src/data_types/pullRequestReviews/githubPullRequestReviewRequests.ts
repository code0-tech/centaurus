import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreatePullRequestReviewRequestSchema = z.object({
    body: z.string().optional(),
    event: z.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"]).optional(),
    comments: z.array(z.looseObject({})).optional(),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"]["parameters"], "owner" | "repo" | "pull_number">>
export type GitHubCreatePullRequestReviewRequest = z.infer<typeof GitHubCreatePullRequestReviewRequestSchema>

export const GitHubSubmitPullRequestReviewRequestSchema = z.object({
    body: z.string().optional(),
    event: z.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"]),
}) as unknown as z.ZodType<
    Omit<Endpoints["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events"]["parameters"], "owner" | "repo" | "pull_number" | "review_id">
>
export type GitHubSubmitPullRequestReviewRequest = z.infer<typeof GitHubSubmitPullRequestReviewRequestSchema>

export const GitHubDismissPullRequestReviewRequestSchema = z.object({
    message: z.string().min(1),
}) as unknown as z.ZodType<
    Omit<
        Endpoints["PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals"]["parameters"],
        "owner" | "repo" | "pull_number" | "review_id"
    >
>
export type GitHubDismissPullRequestReviewRequest = z.infer<typeof GitHubDismissPullRequestReviewRequestSchema>

@Identifier("GITHUB_CREATE_PULL_REQUEST_REVIEW_REQUEST")
@Name({ code: "en-US", content: "Create GitHub pull request review request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request review request" })
@Schema(GitHubCreatePullRequestReviewRequestSchema)
export class GitHubCreatePullRequestReviewRequestDataType {}

@Identifier("GITHUB_SUBMIT_PULL_REQUEST_REVIEW_REQUEST")
@Name({ code: "en-US", content: "Submit GitHub pull request review request" })
@DisplayMessage({ code: "en-US", content: "Submit GitHub pull request review request" })
@Schema(GitHubSubmitPullRequestReviewRequestSchema)
export class GitHubSubmitPullRequestReviewRequestDataType {}

@Identifier("GITHUB_DISMISS_PULL_REQUEST_REVIEW_REQUEST")
@Name({ code: "en-US", content: "Dismiss GitHub pull request review request" })
@DisplayMessage({ code: "en-US", content: "Dismiss GitHub pull request review request" })
@Schema(GitHubDismissPullRequestReviewRequestSchema)
export class GitHubDismissPullRequestReviewRequestDataType {}
