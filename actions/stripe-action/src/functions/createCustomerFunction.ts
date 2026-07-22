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
import {StripeCustomer, StripeCustomerSchema} from "../data_types/stripeCustomer.ts";

@Identifier("createCustomer")
@DisplayIcon("simple:stripe")
@Signature("(email?: string, name?: string, description?: string): STRIPE_CUSTOMER")
@Name({code: "en-US", content: "Create customer"})
@DisplayMessage({code: "en-US", content: "Create Stripe customer"})
@Documentation({
    code: "en-US",
    content: "Creates a new Stripe customer. Customers can later be attached to payment intents to track payments and reuse saved payment methods.",
})
@Description({
    code: "en-US",
    content: "Creates a new Stripe customer.",
})
@Parameter({
    runtimeName: "email",
    name: [{code: "en-US", content: "Email"}],
    description: [{code: "en-US", content: "The customer's email address."}],
    optional: true,
})
@Parameter({
    runtimeName: "name",
    name: [{code: "en-US", content: "Name"}],
    description: [{code: "en-US", content: "The customer's full name or business name."}],
    optional: true,
})
@Parameter({
    runtimeName: "description",
    name: [{code: "en-US", content: "Description"}],
    description: [{code: "en-US", content: "An arbitrary description to store on the customer."}],
    optional: true,
})
export class CreateCustomerFunction {
    async run(
        context: FunctionContext,
        email?: string,
        name?: string,
        description?: string
    ): Promise<StripeCustomer> {
        const stripe = getStripeClient(context);
        try {
            const customer = await stripe.customers.create({email, name, description});
            return StripeCustomerSchema.parse(customer);
        } catch (error) {
            throw toRuntimeError("STRIPE_CREATE_CUSTOMER_FAILED", error);
        }
    }
}
