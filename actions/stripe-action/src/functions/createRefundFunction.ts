import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import {getStripeClient, toRuntimeError} from "../helpers.ts";
import {StripeRefund, StripeRefundSchema} from "../data_types/stripeRefund.ts";

@Identifier("createRefund")
@DisplayIcon("simple:stripe")
@Signature("(paymentIntent: string, amount?: number): STRIPE_REFUND")
@Name({code: "en-US", content: "Create refund"})
@DisplayMessage({code: "en-US", content: "Refund Stripe payment intent ${paymentIntent}"})
@Documentation({
    code: "en-US",
    content: "Refunds a Stripe payment. Provide the PaymentIntent id (pi_...) to refund. Leave the amount empty to refund the full amount, or set it (in the smallest currency unit) for a partial refund.",
})
@Description({
    code: "en-US",
    content: "Refunds a Stripe payment, fully or partially.",
})
@Parameter({
    runtimeName: "paymentIntent",
    name: [{code: "en-US", content: "Payment intent ID"}],
    description: [{code: "en-US", content: "The ID of the PaymentIntent to refund (pi_...)."}],
})
@Parameter({
    runtimeName: "amount",
    name: [{code: "en-US", content: "Amount"}],
    description: [{code: "en-US", content: "Amount to refund, in the smallest currency unit. Leave empty to refund the full amount."}],
    optional: true,
})
export class CreateRefundFunction {
    async run(context: FunctionContext, paymentIntent: string, amount?: number): Promise<StripeRefund> {
        const stripe = getStripeClient(context);
        try {
            const refund = await stripe.refunds.create({payment_intent: paymentIntent, amount});
            return StripeRefundSchema.parse(refund);
        } catch (error) {
            throw toRuntimeError("STRIPE_CREATE_REFUND_FAILED", error);
        }
    }
}
