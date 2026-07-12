import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderLineItem")
@Name({code: "en-US", content: "ShopwareOrderLineItem"})
@Schema(schemas.OrderLineItem)
export class ShopwareOrderLineItem {
}
