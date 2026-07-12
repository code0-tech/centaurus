import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderDeliveryPosition")
@Name({code: "en-US", content: "ShopwareOrderDeliveryPosition"})
@Schema(schemas.OrderDeliveryPosition)
export class ShopwareOrderDeliveryPosition {
}
