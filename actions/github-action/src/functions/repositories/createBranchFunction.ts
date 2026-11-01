import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createBranch")
@Signature("(owner: string, repository: string, branch: string, sha: string): void")
@Name({ code: "en-US", content: "Create branch" })
@DisplayMessage({ code: "en-US", content: "Create GitHub branch" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Creates a GitHub branch from a commit SHA." })
@Description({ code: "en-US", content: "Creates a GitHub branch." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "branch", name: [{ code: "en-US", content: "Branch" }], description: [{ code: "en-US", content: "Name of the new branch." }] })
@Parameter({ runtimeName: "sha", name: [{ code: "en-US", content: "SHA" }], description: [{ code: "en-US", content: "Commit SHA the branch starts from." }] })
export class CreateBranchFunction {
    async run(context: FunctionContext, owner: string, repository: string, branch: string, sha: string): Promise<void> {
        try {
            const client = createGitHubClient(context)
            await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/refs`, {
                ref: `refs/heads/${branch}`,
                sha,
            })
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
