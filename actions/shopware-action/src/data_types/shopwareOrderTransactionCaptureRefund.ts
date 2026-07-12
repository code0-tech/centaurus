import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderTransactionCaptureRefund")
@Name({code: "en-US", content: "ShopwareOrderTransactionCaptureRefund"})
@Schema(schemas.OrderTransactionCaptureRefund)
export class ShopwareOrderTransactionCaptureRefund {
}
