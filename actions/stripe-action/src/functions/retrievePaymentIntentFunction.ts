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
import {StripePaymentIntent, StripePaymentIntentSchema} from "../data_types/stripePaymentIntent.ts";

@Identifier("retrievePaymentIntent")
@DisplayIcon("simple:stripe")
@Signature("(paymentIntentId: string): STRIPE_PAYMENT_INTENT")
@Name({code: "en-US", content: "Retrieve payment intent"})
@DisplayMessage({code: "en-US", content: "Retrieve Stripe payment intent ${paymentIntentId}"})
@Documentation({
    code: "en-US",
    content: "Retrieves an existing Stripe PaymentIntent by its id (pi_...). Useful to check the current status of a payment.",
})
@Description({
    code: "en-US",
    content: "Retrieves an existing Stripe PaymentIntent by its id.",
})
@Parameter({
    runtimeName: "paymentIntentId",
    name: [{code: "en-US", content: "Payment intent ID"}],
    description: [{code: "en-US", content: "The ID of the PaymentIntent to retrieve (pi_...)."}],
})
export class RetrievePaymentIntentFunction {
    async run(context: FunctionContext, paymentIntentId: string): Promise<StripePaymentIntent> {
        const stripe = getStripeClient(context);
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            return StripePaymentIntentSchema.parse(paymentIntent);
        } catch (error) {
            throw toRuntimeError("STRIPE_RETRIEVE_PAYMENT_INTENT_FAILED", error);
        }
    }
}
