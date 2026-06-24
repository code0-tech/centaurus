import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const ReturnOptionsSchema = z.object({
    ReturnPrintData: z.boolean().default(true).optional(),
    ReturnRoutingInfo: z.boolean().default(true).optional(),
});
export type ReturnOptions = z.infer<typeof ReturnOptionsSchema>;

@Identifier("GLS_RETURN_OPTIONS")
@Name({ code: "en-US", content: "Return Options" })
@DisplayMessage({ code: "en-US", content: "Return Options" })
@Schema(ReturnOptionsSchema)
export class GlsReturnOptionsDataType {}
