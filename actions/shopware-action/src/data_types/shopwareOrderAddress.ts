import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderAddress")
@Name({code: "en-US", content: "ShopwareOrderAddress"})
@Schema(schemas.OrderAddress)
export class ShopwareOrderAddress {
}
