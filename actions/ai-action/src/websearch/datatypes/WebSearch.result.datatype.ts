import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiWebSearchHitSchema } from "./WebSearch.hit.datatype.js";

export const AiWebSearchResultSchema = z.object({
    query: z.string(),
    results: z.array(AiWebSearchHitSchema),
    answer: z.string().optional(),
});
export type AiWebSearchResult = z.infer<typeof AiWebSearchResultSchema>;

@Identifier("AI_WEB_SEARCH_RESULT")
@Name({ code: "en-US", content: "Web search result" })
@DisplayMessage({ code: "en-US", content: "Web search for ${query}" })
@Schema(AiWebSearchResultSchema)
export class AiWebSearchResultDataType {}
