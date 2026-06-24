import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AddressSchema } from "./glsAddress.js";

export const ConsigneeSchema = z.object({
    ConsigneeID: z.string().max(40).optional(),
    CostCenter: z.string().max(80).optional(),
    Category: z.enum(["BUSINESS", "PRIVATE"]).optional(),
    Address: AddressSchema,
});
export type Consignee = z.infer<typeof ConsigneeSchema>;

@Identifier("GLS_CONSIGNEE")
@Name({ code: "en-US", content: "Consignee" })
@DisplayMessage({ code: "en-US", content: "Consignee" })
@Schema(ConsigneeSchema)
export class GlsConsigneeDataType {}
