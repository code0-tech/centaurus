import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderTransactionCapture")
@Name({code: "en-US", content: "ShopwareOrderTransactionCapture"})
@Schema(schemas.OrderTransactionCapture)
export class ShopwareOrderTransactionCapture {
}
