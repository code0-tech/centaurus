import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubRelease, GitHubReleaseSchema } from "../../data_types/releases/githubRelease.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getRelease")
@Signature("(owner: string, repository: string, releaseId: number): GITHUB_RELEASE")
@Name({ code: "en-US", content: "Get release" })
@DisplayMessage({ code: "en-US", content: "Get GitHub release" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Returns a GitHub release." })
@Description({ code: "en-US", content: "Returns a GitHub release." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "releaseId", name: [{ code: "en-US", content: "Release ID" }], description: [{ code: "en-US", content: "Identifier of the release." }] })
export class GetReleaseFunction {
    async run(context: FunctionContext, owner: string, repository: string, releaseId: number): Promise<GitHubRelease> {
        if (!Number.isInteger(releaseId) || releaseId < 1) throw new RuntimeError("GITHUB_INVALID_RELEASE_ID", "Release ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases/${releaseId}`)
            return GitHubReleaseSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
