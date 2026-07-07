import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {schemas} from "../generated/shopware-schemas.ts";

export const ShopwareOrderPlacedPayloadSchema = z.object({
    data: z.object({
        payload: z.object({
            order: schemas.Order,
        }),
        event: z.literal("checkout.order.placed"),
    }),
    source: z.object({
        url: z.string(),
        appVersion: z.string(),
        shopId: z.string(),
        eventId: z.string().optional(),
    }),
    timestamp: z.number().int(),
});

@Identifier("ShopwareOrderPlacedWebhookPayload")
@Name({code: "en-US", content: "ShopwareOrderPlacedWebhookPayload"})
@Schema(ShopwareOrderPlacedPayloadSchema)
export class ShopwareOrderPlacedWebhookPayload {
}
