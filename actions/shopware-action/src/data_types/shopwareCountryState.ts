import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareCountryState")
@Name({code: "en-US", content: "ShopwareCountryState"})
@Schema(schemas.CountryState)
export class ShopwareCountryState {
}
