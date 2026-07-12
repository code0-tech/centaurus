import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderCustomer")
@Name({code: "en-US", content: "ShopwareOrderCustomer"})
@Schema(schemas.OrderCustomer)
export class ShopwareOrderCustomer {
}
