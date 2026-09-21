import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubRelease, GitHubReleaseSchema } from "../../data_types/releases/githubRelease.js"
import { GitHubUpdateReleaseRequest } from "../../data_types/releases/githubReleaseRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("updateRelease")
@Signature("(owner: string, repository: string, releaseId: number, data: GITHUB_UPDATE_RELEASE_REQUEST): GITHUB_RELEASE")
@Name({ code: "en-US", content: "Update release" })
@DisplayMessage({ code: "en-US", content: "Update GitHub release" })
@Documentation({ code: "en-US", content: "Updates a GitHub release." })
@Description({ code: "en-US", content: "Updates a GitHub release." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "releaseId", name: [{ code: "en-US", content: "Release ID" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Release updates" }] })
export class UpdateReleaseFunction {
    async run(context: FunctionContext, owner: string, repository: string, releaseId: number, data: GitHubUpdateReleaseRequest): Promise<GitHubRelease> {
        if (!Number.isInteger(releaseId) || releaseId < 1) throw new RuntimeError("GITHUB_INVALID_RELEASE_ID", "Release ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases/${releaseId}`, data)
            return GitHubReleaseSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
