import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {schemas} from "../generated/shopware-schemas.ts";

export const ShopwareOrderCancelledPayloadSchema = z.object({
    data: z.object({
        payload: z.object({
            order: schemas.Order,
        }),
        event: z.literal("state_enter.order.state.cancelled"),
    }),
    source: z.object({
        url: z.string(),
        appVersion: z.string(),
        shopId: z.string(),
        eventId: z.string().optional(),
    }),
    timestamp: z.number().int(),
});

@Identifier("ShopwareOrderCancelledWebhookPayload")
@Name({code: "en-US", content: "ShopwareOrderCancelledWebhookPayload"})
@Schema(ShopwareOrderCancelledPayloadSchema)
export class ShopwareOrderCancelledWebhookPayload {
}
