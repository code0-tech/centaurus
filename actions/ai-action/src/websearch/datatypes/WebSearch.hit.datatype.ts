import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiWebSearchHitSchema = z.object({
    title: z.string(),
    url: z.string(),
    content: z.string(),
    score: z.number().optional(),
});
export type AiWebSearchHit = z.infer<typeof AiWebSearchHitSchema>;

@Identifier("AI_WEB_SEARCH_HIT")
@Name({ code: "en-US", content: "Web search hit" })
@DisplayMessage({ code: "en-US", content: "${title}" })
@Schema(AiWebSearchHitSchema)
export class AiWebSearchHitDataType {}
