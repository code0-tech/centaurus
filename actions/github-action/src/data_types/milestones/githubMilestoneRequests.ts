import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreateMilestoneRequestSchema = z.object({
    title: z.string().min(1),
    state: z.enum(["open", "closed"]).optional(),
    description: z.string().optional(),
    due_on: z.iso.datetime().optional(),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/milestones"]["parameters"], "owner" | "repo">>
export type GitHubCreateMilestoneRequest = z.infer<typeof GitHubCreateMilestoneRequestSchema>

export const GitHubUpdateMilestoneRequestSchema = z.object({
    title: z.string().min(1).optional(),
    state: z.enum(["open", "closed"]).optional(),
    description: z.string().optional(),
    due_on: z.iso.datetime().nullable().optional(),
}) as unknown as z.ZodType<Omit<Endpoints["PATCH /repos/{owner}/{repo}/milestones/{milestone_number}"]["parameters"], "owner" | "repo" | "milestone_number">>
export type GitHubUpdateMilestoneRequest = z.infer<typeof GitHubUpdateMilestoneRequestSchema>

@Identifier("GITHUB_CREATE_MILESTONE_REQUEST")
@Name({ code: "en-US", content: "Create GitHub milestone request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub milestone request" })
@Schema(GitHubCreateMilestoneRequestSchema)
export class GitHubCreateMilestoneRequestDataType {}

@Identifier("GITHUB_UPDATE_MILESTONE_REQUEST")
@Name({ code: "en-US", content: "Update GitHub milestone request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub milestone request" })
@Schema(GitHubUpdateMilestoneRequestSchema)
export class GitHubUpdateMilestoneRequestDataType {}
