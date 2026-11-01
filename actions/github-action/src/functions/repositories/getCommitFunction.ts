import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubCommit, GitHubCommitSchema } from "../../data_types/repositories/githubCommit.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getCommit")
@Signature("(owner: string, repository: string, ref: string): GITHUB_COMMIT")
@Name({ code: "en-US", content: "Get commit" })
@DisplayMessage({ code: "en-US", content: "Get GitHub commit" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Returns a commit by SHA, branch, or tag." })
@Description({ code: "en-US", content: "Returns a GitHub commit." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "ref", name: [{ code: "en-US", content: "Ref" }], description: [{ code: "en-US", content: "Name of the branch to create." }] })
export class GetCommitFunction {
    async run(context: FunctionContext, owner: string, repository: string, ref: string): Promise<GitHubCommit> {
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${encodeURIComponent(ref)}`)
            return GitHubCommitSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
