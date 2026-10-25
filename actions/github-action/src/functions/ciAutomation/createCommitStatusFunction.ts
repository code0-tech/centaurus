import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubCommitStatus, GitHubCommitStatusSchema } from "../../data_types/ciAutomation/githubCiAutomation.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("createCommitStatus")
@Signature(
    '(owner: string, repository: string, sha: string, state: "error"|"failure"|"pending"|"success", description?: string, targetUrl?: string, statusContext?: string): GITHUB_COMMIT_STATUS'
)
@Name({ code: "en-US", content: "Create commit status" })
@DisplayMessage({ code: "en-US", content: "Create GitHub commit status" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Creates a commit status." })
@Description({ code: "en-US", content: "Creates a GitHub commit status." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "sha", name: [{ code: "en-US", content: "SHA" }], description: [{ code: "en-US", content: "Commit SHA the status belongs to." }] })
@Parameter({ runtimeName: "state", name: [{ code: "en-US", content: "State" }], description: [{ code: "en-US", content: "State of the commit status." }] })
@Parameter({
    runtimeName: "description",
    name: [{ code: "en-US", content: "Description" }],
    description: [{ code: "en-US", content: "Short text shown next to the status." }],
    optional: true,
})
@Parameter({
    runtimeName: "targetUrl",
    name: [{ code: "en-US", content: "Target URL" }],
    description: [{ code: "en-US", content: "URL the status links to." }],
    optional: true,
})
@Parameter({
    runtimeName: "statusContext",
    name: [{ code: "en-US", content: "Context" }],
    description: [{ code: "en-US", content: "Label that identifies the system sending the status." }],
    optional: true,
})
export class CreateCommitStatusFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        sha: string,
        state: "error" | "failure" | "pending" | "success",
        description?: string,
        targetUrl?: string,
        statusContext?: string
    ): Promise<GitHubCommitStatus> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/statuses/${encodeURIComponent(sha)}`,
                requestBody({ state, description, target_url: targetUrl, context: statusContext })
            )
            return GitHubCommitStatusSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
