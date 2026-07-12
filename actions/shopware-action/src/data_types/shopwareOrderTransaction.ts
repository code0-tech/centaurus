import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderTransaction")
@Name({code: "en-US", content: "ShopwareOrderTransaction"})
@Schema(schemas.OrderTransaction)
export class ShopwareOrderTransaction {
}
