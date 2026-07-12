import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrder")
@Name({code: "en-US", content: "ShopwareOrder"})
@Schema(schemas.Order)
export class ShopwareOrder {
}
