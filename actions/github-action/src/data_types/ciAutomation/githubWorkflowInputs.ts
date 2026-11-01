import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"

/** Free-form inputs of a workflow dispatch: the keys are defined by the workflow itself. */
export const GitHubWorkflowInputsSchema = z.looseObject({})
export type GitHubWorkflowInputs = z.infer<typeof GitHubWorkflowInputsSchema>

@Identifier("GITHUB_WORKFLOW_INPUTS")
@Name({ code: "en-US", content: "GitHub workflow inputs" })
@DisplayMessage({ code: "en-US", content: "GitHub workflow inputs" })
@Schema(GitHubWorkflowInputsSchema)
export class GitHubWorkflowInputsDataType {}
