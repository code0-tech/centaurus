import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderDelivery")
@Name({code: "en-US", content: "ShopwareOrderDelivery"})
@Schema(schemas.OrderDelivery)
export class ShopwareOrderDelivery {
}
