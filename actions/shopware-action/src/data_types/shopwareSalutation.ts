import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareSalutation")
@Name({code: "en-US", content: "ShopwareSalutation"})
@Schema(schemas.Salutation)
export class ShopwareSalutation {
}
