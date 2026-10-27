import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubCheckRun, GitHubCheckRunSchema } from "../../data_types/ciAutomation/githubCiAutomation.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("createCheckRun")
@Signature(
    '(owner: string, repository: string, name: string, headSha: string, status?: "queued"|"in_progress"|"completed", conclusion?: "success"|"failure"|"neutral"|"cancelled"|"skipped"|"timed_out"|"action_required", detailsUrl?: string, externalId?: string, startedAt?: string, completedAt?: string, summaryTitle?: string, summaryText?: string): GITHUB_CHECK_RUN'
)
@Name({ code: "en-US", content: "Create check run" })
@DisplayMessage({ code: "en-US", content: "Create GitHub check run" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Creates a check run for a commit." })
@Description({ code: "en-US", content: "Creates a GitHub check run." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "name", name: [{ code: "en-US", content: "Name" }], description: [{ code: "en-US", content: "Name of the check run." }] })
@Parameter({ runtimeName: "headSha", name: [{ code: "en-US", content: "Commit SHA" }], description: [{ code: "en-US", content: "SHA of the commit that is checked." }] })
@Parameter({
    runtimeName: "status",
    name: [{ code: "en-US", content: "Status" }],
    description: [{ code: "en-US", content: "How far along the check run is." }],
    optional: true,
})
@Parameter({
    runtimeName: "conclusion",
    name: [{ code: "en-US", content: "Conclusion" }],
    description: [{ code: "en-US", content: "Result of the check run. Setting it completes the check run." }],
    optional: true,
})
@Parameter({
    runtimeName: "detailsUrl",
    name: [{ code: "en-US", content: "Details URL" }],
    description: [{ code: "en-US", content: "URL with the full results of the check run." }],
    optional: true,
})
@Parameter({
    runtimeName: "externalId",
    name: [{ code: "en-US", content: "External ID" }],
    description: [{ code: "en-US", content: "Identifier of the check run in the system that reports it." }],
    optional: true,
})
@Parameter({
    runtimeName: "startedAt",
    name: [{ code: "en-US", content: "Started at" }],
    description: [{ code: "en-US", content: "When the check run started, as an ISO 8601 timestamp." }],
    optional: true,
})
@Parameter({
    runtimeName: "completedAt",
    name: [{ code: "en-US", content: "Completed at" }],
    description: [{ code: "en-US", content: "When the check run finished, as an ISO 8601 timestamp." }],
    optional: true,
})
@Parameter({
    runtimeName: "summaryTitle",
    name: [{ code: "en-US", content: "Summary title" }],
    description: [{ code: "en-US", content: "Title of the result summary shown on the check run." }],
    optional: true,
})
@Parameter({
    runtimeName: "summaryText",
    name: [{ code: "en-US", content: "Summary" }],
    description: [{ code: "en-US", content: "Result summary shown on the check run. Markdown is supported." }],
    optional: true,
})
export class CreateCheckRunFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        name: string,
        headSha: string,
        status?: "queued" | "in_progress" | "completed",
        conclusion?: "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required",
        detailsUrl?: string,
        externalId?: string,
        startedAt?: string,
        completedAt?: string,
        summaryTitle?: string,
        summaryText?: string
    ): Promise<GitHubCheckRun> {
        try {
            const client = createGitHubClient(context)
            const output = requestBody({ title: summaryTitle, summary: summaryText })
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/check-runs`,
                requestBody({
                    name,
                    head_sha: headSha,
                    status,
                    conclusion,
                    details_url: detailsUrl,
                    external_id: externalId,
                    started_at: startedAt,
                    completed_at: completedAt,
                    output: Object.keys(output).length > 0 ? output : undefined,
                })
            )
            return GitHubCheckRunSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
