import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"

/*
 * Reference types for values that a workflow either types out by hand or takes from an earlier
 * function. GitHub wants a label name, a user login, and a milestone number in request bodies,
 * but the functions in this action return whole label, user, and milestone objects. Accepting
 * both shapes keeps those outputs referenceable as variables without reshaping any response.
 */

/** A label, either by name or as any label object returned by another function. */
export const GitHubLabelReferenceSchema = z.union([z.string(), z.object({ name: z.string() })])
export type GitHubLabelReference = z.infer<typeof GitHubLabelReferenceSchema>

@Identifier("GITHUB_LABEL_REFERENCE")
@Name({ code: "en-US", content: "GitHub label reference" })
@DisplayMessage({ code: "en-US", content: "Label name or label object" })
@Schema(GitHubLabelReferenceSchema)
export class GitHubLabelReferenceDataType {}

/** A user, either by login or as any user object returned by another function. */
export const GitHubUserReferenceSchema = z.union([z.string(), z.object({ login: z.string() })])
export type GitHubUserReference = z.infer<typeof GitHubUserReferenceSchema>

@Identifier("GITHUB_USER_REFERENCE")
@Name({ code: "en-US", content: "GitHub user reference" })
@DisplayMessage({ code: "en-US", content: "Username or user object" })
@Schema(GitHubUserReferenceSchema)
export class GitHubUserReferenceDataType {}

/** A milestone, either by number or as any milestone object returned by another function. */
export const GitHubMilestoneReferenceSchema = z.union([z.number(), z.object({ number: z.number() })])
export type GitHubMilestoneReference = z.infer<typeof GitHubMilestoneReferenceSchema>

@Identifier("GITHUB_MILESTONE_REFERENCE")
@Name({ code: "en-US", content: "GitHub milestone reference" })
@DisplayMessage({ code: "en-US", content: "Milestone number or milestone object" })
@Schema(GitHubMilestoneReferenceSchema)
export class GitHubMilestoneReferenceDataType {}
