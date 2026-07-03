import { z } from "zod"

export const GitHubUserSchema = z.object({
    login: z.string(),
    id: z.int(),
    node_id: z.string(),
    avatar_url: z.url(),
    html_url: z.url(),
    type: z.string(),
    site_admin: z.boolean(),
})
export type GitHubUser = z.infer<typeof GitHubUserSchema>

export const GitHubLabelSchema = z.object({
    id: z.int(),
    node_id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    color: z.string(),
    default: z.boolean(),
})
export type GitHubLabel = z.infer<typeof GitHubLabelSchema>

export const GitHubTeamSchema = z.object({
    id: z.int(),
    node_id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    privacy: z.string(),
    html_url: z.url(),
})
export type GitHubTeam = z.infer<typeof GitHubTeamSchema>

export const GitHubLicenseSchema = z.object({
    key: z.string(),
    name: z.string(),
    spdx_id: z.string().nullable(),
    url: z.url().nullable(),
    node_id: z.string(),
})
export type GitHubLicense = z.infer<typeof GitHubLicenseSchema>

export const GitHubMilestoneSchema = z.object({
    id: z.int(),
    node_id: z.string(),
    number: z.int(),
    title: z.string(),
    description: z.string().nullable(),
    state: z.enum(["open", "closed"]),
    open_issues: z.int(),
    closed_issues: z.int(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
    closed_at: z.iso.datetime().nullable(),
    due_on: z.iso.datetime().nullable(),
})
export type GitHubMilestone = z.infer<typeof GitHubMilestoneSchema>

export const GitHubRepositoryReferenceSchema = z.object({
    id: z.int(),
    node_id: z.string(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
    owner: GitHubUserSchema,
    html_url: z.url(),
    description: z.string().nullable(),
    fork: z.boolean(),
    url: z.url(),
})
export type GitHubRepositoryReference = z.infer<typeof GitHubRepositoryReferenceSchema>
