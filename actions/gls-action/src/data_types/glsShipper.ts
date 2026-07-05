import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AddressSchema } from "./glsAddress.js";

export const ShipperSchema = z.object({
    AlternativeShipperAddress: AddressSchema.nullish(),
    Address: AddressSchema.nullish(),
});
export type ShipperSchemaType = z.infer<typeof ShipperSchema>;

export const InternalShipperSchema = ShipperSchema.extend({
    ContactID: z.string().nullish(),
});
export type InternalShipper = z.infer<typeof InternalShipperSchema>;

@Identifier("GLS_SHIPPER")
@Name({ code: "en-US", content: "Shipper" })
@DisplayMessage({ code: "en-US", content: "Shipper" })
@Schema(ShipperSchema)
export class GlsShipperDataType {}
