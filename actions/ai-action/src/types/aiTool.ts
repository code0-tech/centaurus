import {z} from "zod";
import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../src/helpers";

export const TOOL_REGISTRY = {
    github: {
        url: "https://api.githubcopilot.com/mcp/",
        tools: [
            "add_comment_to_pending_review",
            "add_issue_comment",
            "add_reply_to_pull_request_comment",
            "assign_copilot_to_issue",
            "create_branch",
            "create_or_update_file",
            "create_pull_request",
            "create_pull_request_with_copilot",
            "create_repository",
            "delete_file",
            "fork_repository",
            "get_commit",
            "get_copilot_job_status",
            "get_file_contents",
            "get_label",
            "get_latest_release",
            "get_release_by_tag",
            "get_tag",
            "get_team_members",
            "get_teams",
            "issue_read",
            "issue_write",
            "list_branches",
            "list_commits",
            "list_issue_types",
            "list_issues",
            "list_pull_requests",
            "list_releases",
            "list_tags",
            "merge_pull_request",
            "pull_request_read",
            "pull_request_review_write",
            "push_files",
            "request_copilot_review",
            "run_secret_scanning",
            "search_code",
            "search_issues",
            "search_pull_requests",
            "search_repositories",
            "search_users",
            "sub_issue_write",
            "update_pull_request",
            "update_pull_request_branch"
        ]
    }
} as const


export type ToolProvider = keyof typeof TOOL_REGISTRY
export const ToolProviderEnum = z.enum(Object.keys(TOOL_REGISTRY) as [ToolProvider, ...ToolProvider[]])

export const ToolSchema = z.object({
    providerName: ToolProviderEnum,
    url: z.string(),
    tools: z.array(z.string()).optional()
})

export type Tool = z.infer<typeof ToolSchema>

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("AI_TOOL", ToolSchema),
        identifier: "AI_TOOL"
    })
}