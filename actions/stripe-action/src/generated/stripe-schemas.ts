import { z } from "zod";

const customer = z
  .object({
    address: z.object({}).partial().passthrough().nullish(),
    balance: z.number().int().optional(),
    business_name: z.string().max(150).optional(),
    cash_balance: z.object({}).partial().passthrough().nullish(),
    created: z.number().int(),
    currency: z.string().max(5000).nullish(),
    customer_account: z.string().max(5000).nullish(),
    default_source: z
      .union([z.string(), z.object({}).partial().passthrough()])
      .nullable(),
    delinquent: z.boolean().nullish(),
    description: z.string().max(5000).nullable(),
    discount: z.object({}).partial().passthrough().nullish(),
    email: z.string().max(5000).nullable(),
    id: z.string().max(5000),
    individual_name: z.string().max(150).optional(),
    invoice_credit_balance: z.record(z.string(), z.number().int()).optional(),
    invoice_prefix: z.string().max(5000).nullish(),
    invoice_settings: z.object({}).partial().passthrough().optional(),
    livemode: z.boolean(),
    metadata: z.record(z.string(), z.string().max(500)).optional(),
    name: z.string().max(5000).nullish(),
    next_invoice_sequence: z.number().int().optional(),
    object: z.literal("customer"),
    phone: z.string().max(5000).nullish(),
    preferred_locales: z.array(z.string().max(5000)).nullish(),
    shipping: z.object({}).partial().passthrough().nullable(),
    sources: z
      .object({
        data: z.array(z.object({}).partial().passthrough()),
        has_more: z.boolean(),
        object: z.literal("list"),
        url: z.string().max(5000),
      })
      .passthrough()
      .optional(),
    subscriptions: z
      .object({
        data: z.array(z.object({}).partial().passthrough()),
        has_more: z.boolean(),
        object: z.literal("list"),
        url: z.string().max(5000),
      })
      .passthrough()
      .optional(),
    tax: z.object({}).partial().passthrough().optional(),
    tax_exempt: z.enum(["exempt", "none", "reverse"]).nullish(),
    tax_ids: z
      .object({
        data: z.array(z.object({}).partial().passthrough()),
        has_more: z.boolean(),
        object: z.literal("list"),
        url: z.string().max(5000),
      })
      .passthrough()
      .optional(),
    test_clock: z
      .union([z.string(), z.object({}).partial().passthrough()])
      .nullish(),
  })
  .passthrough();
const refund: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      amount: z.number().int(),
      balance_transaction: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      charge: z.union([z.string(), charge]).nullable(),
      created: z.number().int(),
      currency: z.string(),
      description: z.string().max(5000).optional(),
      destination_details: z.object({}).partial().passthrough().optional(),
      failure_balance_transaction: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .optional(),
      failure_reason: z.string().max(5000).optional(),
      id: z.string().max(5000),
      instructions_email: z.string().max(5000).optional(),
      metadata: z.record(z.string(), z.string().max(500)).nullable(),
      next_action: z.object({}).partial().passthrough().optional(),
      object: z.literal("refund"),
      payment_intent: z.union([z.string(), payment_intent]).nullable(),
      pending_reason: z
        .enum(["charge_pending", "insufficient_funds", "processing"])
        .optional(),
      presentment_details: z.object({}).partial().passthrough().optional(),
      reason: z
        .enum([
          "duplicate",
          "expired_uncaptured_charge",
          "fraudulent",
          "requested_by_customer",
        ])
        .nullable(),
      receipt_number: z.string().max(5000).nullable(),
      source_transfer_reversal: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      status: z.string().max(5000).nullable(),
      transfer_reversal: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
    })
    .passthrough()
);
const charge: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      amount: z.number().int(),
      amount_captured: z.number().int(),
      amount_refunded: z.number().int(),
      application: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      application_fee: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      application_fee_amount: z.number().int().nullable(),
      authorization_code: z.string().max(5000).optional(),
      balance_transaction: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      billing_details: z.object({}).partial().passthrough(),
      calculated_statement_descriptor: z.string().max(5000).nullable(),
      captured: z.boolean(),
      created: z.number().int(),
      currency: z.string(),
      customer: z
        .union([z.string(), customer, z.object({}).partial().passthrough()])
        .nullable(),
      description: z.string().max(40000).nullable(),
      disputed: z.boolean(),
      failure_balance_transaction: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      failure_code: z.string().max(5000).nullable(),
      failure_message: z.string().max(5000).nullable(),
      fraud_details: z.object({}).partial().passthrough().nullable(),
      id: z.string().max(5000),
      level3: z.object({}).partial().passthrough().optional(),
      livemode: z.boolean(),
      metadata: z.record(z.string(), z.string().max(500)),
      object: z.literal("charge"),
      on_behalf_of: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      outcome: z.object({}).partial().passthrough().nullable(),
      paid: z.boolean(),
      payment_intent: z.union([z.string(), payment_intent]).nullable(),
      payment_method: z.string().max(5000).nullable(),
      payment_method_details: z.object({}).partial().passthrough().nullable(),
      presentment_details: z.object({}).partial().passthrough().optional(),
      radar_options: z.object({}).partial().passthrough().optional(),
      receipt_email: z.string().max(5000).nullable(),
      receipt_number: z.string().max(5000).nullable(),
      receipt_url: z.string().max(5000).nullable(),
      refunded: z.boolean(),
      refunds: z
        .object({
          data: z.array(refund),
          has_more: z.boolean(),
          object: z.literal("list"),
          url: z.string().max(5000),
        })
        .passthrough()
        .nullish(),
      review: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      shipping: z.object({}).partial().passthrough().nullable(),
      source: z.object({}).partial().passthrough().nullable(),
      source_transfer: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      statement_descriptor: z.string().max(5000).nullable(),
      statement_descriptor_suffix: z.string().max(5000).nullable(),
      status: z.enum(["failed", "pending", "succeeded"]),
      transfer: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .optional(),
      transfer_data: z.object({}).partial().passthrough().nullable(),
      transfer_group: z.string().max(5000).nullable(),
    })
    .passthrough()
);
const payment_intent: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      amount: z.number().int(),
      amount_capturable: z.number().int(),
      amount_details: z.object({}).partial().passthrough().optional(),
      amount_received: z.number().int(),
      application: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      application_fee_amount: z.number().int().nullable(),
      automatic_payment_methods: z
        .object({})
        .partial()
        .passthrough()
        .nullable(),
      canceled_at: z.number().int().nullable(),
      cancellation_reason: z
        .enum([
          "abandoned",
          "automatic",
          "duplicate",
          "expired",
          "failed_invoice",
          "fraudulent",
          "requested_by_customer",
          "void_invoice",
        ])
        .nullable(),
      capture_method: z.enum(["automatic", "automatic_async", "manual"]),
      client_secret: z.string().max(5000).nullable(),
      confirmation_method: z.enum(["automatic", "manual"]),
      created: z.number().int(),
      currency: z.string(),
      customer: z
        .union([z.string(), customer, z.object({}).partial().passthrough()])
        .nullable(),
      customer_account: z.string().max(5000).nullable(),
      description: z.string().max(5000).nullable(),
      excluded_payment_method_types: z
        .array(
          z.enum([
            "acss_debit",
            "affirm",
            "afterpay_clearpay",
            "alipay",
            "alma",
            "amazon_pay",
            "au_becs_debit",
            "bacs_debit",
            "bancontact",
            "billie",
            "bizum",
            "blik",
            "boleto",
            "card",
            "cashapp",
            "crypto",
            "customer_balance",
            "eps",
            "fpx",
            "giropay",
            "grabpay",
            "ideal",
            "kakao_pay",
            "klarna",
            "konbini",
            "kr_card",
            "mb_way",
            "mobilepay",
            "multibanco",
            "naver_pay",
            "nz_bank_account",
            "oxxo",
            "p24",
            "pay_by_bank",
            "payco",
            "paynow",
            "paypal",
            "payto",
            "pix",
            "promptpay",
            "revolut_pay",
            "samsung_pay",
            "satispay",
            "scalapay",
            "sepa_debit",
            "sofort",
            "sunbit",
            "swish",
            "twint",
            "upi",
            "us_bank_account",
            "wechat_pay",
            "zip",
          ])
        )
        .nullable(),
      hooks: z.object({}).partial().passthrough().optional(),
      id: z.string().max(5000),
      last_payment_error: z.object({}).partial().passthrough().nullable(),
      latest_charge: z.union([z.string(), charge]).nullable(),
      livemode: z.boolean(),
      managed_payments: z.object({}).partial().passthrough().nullable(),
      metadata: z.record(z.string(), z.string().max(500)),
      next_action: z.object({}).partial().passthrough().nullable(),
      object: z.literal("payment_intent"),
      on_behalf_of: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      payment_details: z.object({}).partial().passthrough().optional(),
      payment_method: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      payment_method_configuration_details: z
        .object({})
        .partial()
        .passthrough()
        .nullable(),
      payment_method_options: z.object({}).partial().passthrough().nullable(),
      payment_method_types: z.array(z.string().max(5000)),
      presentment_details: z.object({}).partial().passthrough().optional(),
      processing: z.object({}).partial().passthrough().nullable(),
      receipt_email: z.string().max(5000).nullable(),
      review: z
        .union([z.string(), z.object({}).partial().passthrough()])
        .nullable(),
      setup_future_usage: z.enum(["off_session", "on_session"]).nullable(),
      shipping: z.object({}).partial().passthrough().nullable(),
      source: z
        .union([
          z.string(),
          z.object({}).partial().passthrough(),
          z.object({}).partial().passthrough(),
        ])
        .nullable(),
      statement_descriptor: z.string().max(5000).nullable(),
      statement_descriptor_suffix: z.string().max(5000).nullable(),
      status: z.enum([
        "canceled",
        "processing",
        "requires_action",
        "requires_capture",
        "requires_confirmation",
        "requires_payment_method",
        "succeeded",
      ]),
      transfer_data: z.object({}).partial().passthrough().nullish(),
      transfer_group: z.string().max(5000).nullable(),
    })
    .passthrough()
);

export const schemas = {
  customer,
  refund,
  charge,
  payment_intent,
};
