import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubRepository, GitHubRepositorySchema } from "../../data_types/repositories/githubRepository.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getRepository")
@Signature("(owner: string, repository: string): GITHUB_REPOSITORY")
@Name({ code: "en-US", content: "Get repository" })
@DisplayMessage({ code: "en-US", content: "Get GitHub repository" })
@Documentation({
    code: "en-US",
    content: "Returns information about a GitHub repository.",
})
@Description({
    code: "en-US",
    content: "Returns information about a GitHub repository.",
})
@Parameter({
    runtimeName: "owner",
    name: [{ code: "en-US", content: "Owner" }],
    description: [{ code: "en-US", content: "Repository owner or organization." }],
})
@Parameter({
    runtimeName: "repository",
    name: [{ code: "en-US", content: "Repository" }],
    description: [{ code: "en-US", content: "Repository name." }],
})
export class GetRepositoryFunction {
    async run(context: FunctionContext, owner: string, repository: string): Promise<GitHubRepository> {
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`)

            return GitHubRepositorySchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
