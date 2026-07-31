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

@Identifier("createPaymentIntent")
@DisplayIcon("simple:stripe")
@Signature("(amount: number, currency: string, customer?: string, description?: string): STRIPE_PAYMENT_INTENT")
@Name({code: "en-US", content: "Create payment intent"})
@DisplayMessage({code: "en-US", content: "Create Stripe payment intent for ${amount} ${currency}"})
@Documentation({
    code: "en-US",
    content: "Creates a Stripe PaymentIntent to collect a payment. The amount must be given in the smallest currency unit (e.g. cents for EUR/USD, so 1000 = 10.00). Returns the PaymentIntent including its client secret for completing the payment on the client side.",
})
@Description({
    code: "en-US",
    content: "Creates a Stripe PaymentIntent to collect a payment.",
})
@Parameter({
    runtimeName: "amount",
    name: [{code: "en-US", content: "Amount"}],
    description: [{code: "en-US", content: "Amount to collect, in the smallest currency unit (e.g. 1000 = 10.00 EUR)."}],
})
@Parameter({
    runtimeName: "currency",
    name: [{code: "en-US", content: "Currency"}],
    description: [{code: "en-US", content: "Three-letter ISO currency code in lowercase (e.g. 'eur', 'usd')."}],
})
@Parameter({
    runtimeName: "customer",
    name: [{code: "en-US", content: "Customer"}],
    description: [{code: "en-US", content: "ID of an existing Stripe customer (cus_...) to associate with the payment."}],
    optional: true,
})
@Parameter({
    runtimeName: "description",
    name: [{code: "en-US", content: "Description"}],
    description: [{code: "en-US", content: "An arbitrary description to store on the payment intent."}],
    optional: true,
})
export class CreatePaymentIntentFunction {
    async run(
        context: FunctionContext,
        amount: number,
        currency: string,
        customer?: string,
        description?: string
    ): Promise<StripePaymentIntent> {
        const stripe = getStripeClient(context);
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                customer,
                description,
            });
            return StripePaymentIntentSchema.parse(paymentIntent);
        } catch (error) {
            throw toRuntimeError("STRIPE_CREATE_PAYMENT_INTENT_FAILED", error);
        }
    }
}
