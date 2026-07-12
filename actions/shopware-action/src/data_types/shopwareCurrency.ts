import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareCurrency")
@Name({code: "en-US", content: "ShopwareCurrency"})
@Schema(schemas.Currency)
export class ShopwareCurrency {
}
