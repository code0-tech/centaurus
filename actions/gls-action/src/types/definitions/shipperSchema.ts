import {AddressSchema} from "./addressSchema";
import {z} from "zod";

export const ShipperSchema = z.object({
    AlternativeShipperAddress: AddressSchema.optional(),
    Address: AddressSchema.optional(),
})
export type ShipperSchema = z.infer<typeof ShipperSchema>
export const InternalShipperSchema = ShipperSchema.extend({
    ContactID: z.string().optional()
})
export type InternalShipper = z.infer<typeof InternalShipperSchema>