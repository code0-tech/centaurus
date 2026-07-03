import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { GitHubLicenseSchema, GitHubRepositoryReferenceSchema } from "./githubCommon.js"

export const GitHubRepositorySchema = GitHubRepositoryReferenceSchema.extend({
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
    pushed_at: z.iso.datetime().nullable(),
    git_url: z.string(),
    ssh_url: z.string(),
    clone_url: z.url(),
    svn_url: z.url(),
    homepage: z.string().nullable(),
    size: z.int().nonnegative(),
    stargazers_count: z.int().nonnegative(),
    watchers_count: z.int().nonnegative(),
    language: z.string().nullable(),
    has_issues: z.boolean(),
    has_projects: z.boolean(),
    has_downloads: z.boolean(),
    has_wiki: z.boolean(),
    has_pages: z.boolean(),
    has_discussions: z.boolean(),
    forks_count: z.int().nonnegative(),
    mirror_url: z.string().nullable(),
    archived: z.boolean(),
    disabled: z.boolean(),
    open_issues_count: z.int().nonnegative(),
    license: GitHubLicenseSchema.nullable(),
    allow_forking: z.boolean().optional(),
    is_template: z.boolean().optional(),
    web_commit_signoff_required: z.boolean().optional(),
    topics: z.array(z.string()),
    visibility: z.enum(["public", "private", "internal"]),
    forks: z.int().nonnegative(),
    open_issues: z.int().nonnegative(),
    watchers: z.int().nonnegative(),
    default_branch: z.string(),
})
export type GitHubRepository = z.infer<typeof GitHubRepositorySchema>

@Identifier("GITHUB_REPOSITORY")
@Name({ code: "en-US", content: "GitHub repository" })
@DisplayMessage({ code: "en-US", content: "GitHub repository" })
@Schema(GitHubRepositorySchema)
export class GitHubRepositoryDataType {}
