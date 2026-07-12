import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderTransactionCaptureRefundPosition")
@Name({code: "en-US", content: "ShopwareOrderTransactionCaptureRefundPosition"})
@Schema(schemas.OrderTransactionCaptureRefundPosition)
export class ShopwareOrderTransactionCaptureRefundPosition {
}
