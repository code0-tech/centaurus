import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubLabelSchema = schemas["label"]
export type GitHubLabel = z.infer<typeof GitHubLabelSchema>

@Identifier("GITHUB_LABEL")
@Name({ code: "en-US", content: "GitHub label" })
@DisplayMessage({ code: "en-US", content: "GitHub label" })
@Schema(GitHubLabelSchema)
export class GitHubLabelDataType {}
