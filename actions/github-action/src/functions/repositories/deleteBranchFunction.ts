import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("deleteBranch")
@Signature("(owner: string, repository: string, branch: string): void")
@Name({ code: "en-US", content: "Delete branch" })
@DisplayMessage({ code: "en-US", content: "Delete GitHub branch" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Deletes a GitHub branch ref." })
@Description({ code: "en-US", content: "Deletes a GitHub branch." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "branch", name: [{ code: "en-US", content: "Branch" }], description: [{ code: "en-US", content: "Name of the branch." }] })
export class DeleteBranchFunction {
    async run(context: FunctionContext, owner: string, repository: string, branch: string): Promise<void> {
        try {
            const client = createGitHubClient(context)
            await client.delete(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/refs/${encodeURIComponent(`heads/${branch}`)}`)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
