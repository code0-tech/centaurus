import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubRelease, GitHubReleaseSchema } from "../../data_types/releases/githubRelease.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getReleases")
@Signature("(owner: string, repository: string, page?: number, perPage?: number): GITHUB_RELEASE[]")
@Name({ code: "en-US", content: "Get releases" })
@DisplayMessage({ code: "en-US", content: "Get GitHub releases" })
@Documentation({ code: "en-US", content: "Returns releases from a GitHub repository." })
@Description({ code: "en-US", content: "Returns GitHub releases." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
export class GetReleasesFunction {
    async run(context: FunctionContext, owner: string, repository: string, page = 1, perPage = 30): Promise<GitHubRelease[]> {
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases`, {
                params: { page, per_page: perPage },
            })
            return GitHubReleaseSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
