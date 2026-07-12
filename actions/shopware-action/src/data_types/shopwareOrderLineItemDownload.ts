import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareOrderLineItemDownload")
@Name({code: "en-US", content: "ShopwareOrderLineItemDownload"})
@Schema(schemas.OrderLineItemDownload)
export class ShopwareOrderLineItemDownload {
}
