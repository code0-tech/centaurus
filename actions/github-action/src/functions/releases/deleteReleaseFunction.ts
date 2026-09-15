import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("deleteRelease")
@Signature("(owner: string, repository: string, releaseId: number): void")
@Name({ code: "en-US", content: "Delete release" })
@DisplayMessage({ code: "en-US", content: "Delete GitHub release" })
@Documentation({ code: "en-US", content: "Deletes a GitHub release." })
@Description({ code: "en-US", content: "Deletes a GitHub release." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "releaseId", name: [{ code: "en-US", content: "Release ID" }] })
export class DeleteReleaseFunction {
    async run(context: FunctionContext, owner: string, repository: string, releaseId: number): Promise<void> {
        if (!Number.isInteger(releaseId) || releaseId < 1) throw new RuntimeError("GITHUB_INVALID_RELEASE_ID", "Release ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            await client.delete(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases/${releaseId}`)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
