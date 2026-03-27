import z from "zod";

export const ReturnOptionsSchema = z.object({
    ReturnPrintData: z.boolean().default(true).optional(),
    ReturnRoutingInfo: z.boolean().default(true).optional()
})
 export type ReturnOptions = z.infer<typeof ReturnOptionsSchema>