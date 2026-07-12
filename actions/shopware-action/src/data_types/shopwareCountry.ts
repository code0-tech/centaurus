import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareCountry")
@Name({code: "en-US", content: "ShopwareCountry"})
@Schema(schemas.Country)
export class ShopwareCountry {
}
