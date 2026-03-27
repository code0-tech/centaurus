import {z} from "zod";
import {AddressSchema} from "./addressSchema";

export const ConsigneeSchema = z.object({
    ConsigneeID: z.string().max(40).optional(),
    CostCenter: z.string().max(80).optional(),
    Category: z.enum(["BUSINESS", "PRIVATE"]).optional(),
    Address: AddressSchema
})
export type ConsigneeSchema = z.infer<typeof ConsigneeSchema>