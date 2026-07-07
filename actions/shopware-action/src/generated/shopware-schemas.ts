import { z } from "zod";

const OrderDelivery: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderId: z.string().regex(/^[0-9a-f]{32}$/),
      orderVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      shippingOrderAddressId: z.string().regex(/^[0-9a-f]{32}$/),
      shippingOrderAddressVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      shippingMethodId: z.string().regex(/^[0-9a-f]{32}$/),
      stateId: z.string().regex(/^[0-9a-f]{32}$/),
      trackingCodes: z.array(z.string()).optional(),
      shippingDateEarliest: z.string().datetime({ offset: true }),
      shippingDateLatest: z.string().datetime({ offset: true }),
      shippingCosts: z
        .object({
          unitPrice: z.number(),
          totalPrice: z.number(),
          quantity: z.number().int(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          referencePrice: z.object({}).partial().passthrough().optional(),
          listPrice: z
            .object({
              price: z.number(),
              discount: z.number(),
              percentage: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
          regulationPrice: z
            .object({ price: z.number() })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      stateMachineState: StateMachineState.optional(),
      order: Order.optional(),
      shippingOrderAddress: OrderAddress.optional(),
      shippingMethod: z.object({}).partial().passthrough().optional(),
      positions: z.array(OrderDeliveryPosition).optional(),
      primaryOrder: Order.optional(),
    })
    .passthrough()
);
const OrderDeliveryPosition: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderDeliveryId: z.string().regex(/^[0-9a-f]{32}$/),
      orderDeliveryVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderLineItemId: z.string().regex(/^[0-9a-f]{32}$/),
      orderLineItemVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      price: z
        .object({
          unitPrice: z.number(),
          totalPrice: z.number(),
          quantity: z.number().int(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          referencePrice: z.object({}).partial().passthrough().optional(),
          listPrice: z
            .object({
              price: z.number(),
              discount: z.number(),
              percentage: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
          regulationPrice: z
            .object({ price: z.number() })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      unitPrice: z.number().optional(),
      totalPrice: z.number().optional(),
      quantity: z.number().int().optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      orderDelivery: OrderDelivery.optional(),
      orderLineItem: OrderLineItem.optional(),
    })
    .passthrough()
);
const OrderLineItemDownload: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderLineItemId: z.string().regex(/^[0-9a-f]{32}$/),
      orderLineItemVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      mediaId: z.string().regex(/^[0-9a-f]{32}$/),
      position: z.number().int(),
      accessGranted: z.boolean(),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      orderLineItem: OrderLineItem.optional(),
      media: z.object({}).partial().passthrough().optional(),
    })
    .passthrough()
);
const OrderLineItem: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderId: z.string().regex(/^[0-9a-f]{32}$/),
      orderVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      productId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      productVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      promotionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      parentId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      parentVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      coverId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      identifier: z.string(),
      referencedId: z.string().optional(),
      quantity: z.number().int(),
      label: z.string(),
      payload: z.object({}).partial().passthrough().optional(),
      good: z.boolean().optional(),
      removable: z.boolean().optional(),
      stackable: z.boolean().optional(),
      position: z.number().int().optional(),
      price: z
        .object({
          unitPrice: z.number(),
          totalPrice: z.number(),
          quantity: z.number().int(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          referencePrice: z.object({}).partial().passthrough().optional(),
          listPrice: z
            .object({
              price: z.number(),
              discount: z.number(),
              percentage: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
          regulationPrice: z
            .object({ price: z.number() })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough(),
      priceDefinition: z.object({}).partial().passthrough().optional(),
      unitPrice: z.number().optional(),
      totalPrice: z.number().optional(),
      description: z.string().optional(),
      type: z
        .enum([
          "product",
          "credit",
          "custom",
          "promotion",
          "container",
          "discount",
          "quantity",
        ])
        .optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      states: z.array(z.string()),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      cover: z.object({}).partial().passthrough().optional(),
      order: Order.optional(),
      product: z.object({}).partial().passthrough().optional(),
      promotion: z.object({}).partial().passthrough().optional(),
      orderDeliveryPositions: z.array(OrderDeliveryPosition).optional(),
      orderTransactionCaptureRefundPositions: z
        .array(OrderTransactionCaptureRefundPosition)
        .optional(),
      downloads: z.array(OrderLineItemDownload).optional(),
      parent: OrderLineItem.optional(),
      children: z.array(OrderLineItem),
    })
    .passthrough()
);
const OrderTransactionCaptureRefundPosition: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      refundId: z.string().regex(/^[0-9a-f]{32}$/),
      refundVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderLineItemId: z.string().regex(/^[0-9a-f]{32}$/),
      orderLineItemVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      externalReference: z.string().optional(),
      reason: z.string().optional(),
      quantity: z.number().int().optional(),
      amount: z
        .object({
          unitPrice: z.number(),
          totalPrice: z.number(),
          quantity: z.number().int(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          referencePrice: z.object({}).partial().passthrough().optional(),
          listPrice: z
            .object({
              price: z.number(),
              discount: z.number(),
              percentage: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
          regulationPrice: z
            .object({ price: z.number() })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough(),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      orderLineItem: OrderLineItem.optional(),
      orderTransactionCaptureRefund: OrderTransactionCaptureRefund.optional(),
      shippingCosts: z
        .object({
          calculatedTaxes: z.unknown(),
          taxRules: z.unknown(),
          referencePrice: z.unknown(),
          listPrice: z
            .object({
              price: z.unknown(),
              discount: z.unknown(),
              percentage: z.unknown(),
            })
            .partial()
            .passthrough(),
          regulationPrice: z
            .object({ price: z.unknown() })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough()
);
const OrderTransactionCaptureRefund: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      captureId: z.string().regex(/^[0-9a-f]{32}$/),
      captureVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      stateId: z.string().regex(/^[0-9a-f]{32}$/),
      externalReference: z.string().optional(),
      reason: z.string().optional(),
      amount: z
        .object({
          unitPrice: z.number(),
          totalPrice: z.number(),
          quantity: z.number().int(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          referencePrice: z.object({}).partial().passthrough().optional(),
          listPrice: z
            .object({
              price: z.number(),
              discount: z.number(),
              percentage: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
          regulationPrice: z
            .object({ price: z.number() })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough(),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      stateMachineState: StateMachineState.optional(),
      transactionCapture: OrderTransactionCapture.optional(),
      positions: z.array(OrderTransactionCaptureRefundPosition).optional(),
      shippingCosts: z
        .object({
          calculatedTaxes: z.unknown(),
          taxRules: z.unknown(),
          referencePrice: z.unknown(),
          listPrice: z
            .object({
              price: z.unknown(),
              discount: z.unknown(),
              percentage: z.unknown(),
            })
            .partial()
            .passthrough(),
          regulationPrice: z
            .object({ price: z.unknown() })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough()
);
const OrderTransactionCapture: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderTransactionId: z.string().regex(/^[0-9a-f]{32}$/),
      orderTransactionVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      stateId: z.string().regex(/^[0-9a-f]{32}$/),
      externalReference: z.string().optional(),
      amount: z
        .object({
          unitPrice: z.number(),
          totalPrice: z.number(),
          quantity: z.number().int(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          referencePrice: z.object({}).partial().passthrough().optional(),
          listPrice: z
            .object({
              price: z.number(),
              discount: z.number(),
              percentage: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
          regulationPrice: z
            .object({ price: z.number() })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough(),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      stateMachineState: StateMachineState.optional(),
      transaction: OrderTransaction.optional(),
      refunds: z.array(OrderTransactionCaptureRefund).optional(),
      shippingCosts: z
        .object({
          calculatedTaxes: z.unknown(),
          taxRules: z.unknown(),
          referencePrice: z.unknown(),
          listPrice: z
            .object({
              price: z.unknown(),
              discount: z.unknown(),
              percentage: z.unknown(),
            })
            .partial()
            .passthrough(),
          regulationPrice: z
            .object({ price: z.unknown() })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough()
);
const OrderTransaction: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderId: z.string().regex(/^[0-9a-f]{32}$/),
      orderVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      paymentMethodId: z.string().regex(/^[0-9a-f]{32}$/),
      amount: z
        .object({
          unitPrice: z.number(),
          totalPrice: z.number(),
          quantity: z.number().int(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          referencePrice: z.object({}).partial().passthrough().optional(),
          listPrice: z
            .object({
              price: z.number(),
              discount: z.number(),
              percentage: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
          regulationPrice: z
            .object({ price: z.number() })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough(),
      validationData: z.object({}).partial().passthrough().optional(),
      stateId: z.string().regex(/^[0-9a-f]{32}$/),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      stateMachineState: StateMachineState.optional(),
      order: Order.optional(),
      paymentMethod: z.object({}).partial().passthrough().optional(),
      captures: z.array(OrderTransactionCapture).optional(),
      primaryOrder: Order.optional(),
      shippingCosts: z
        .object({
          calculatedTaxes: z.unknown(),
          taxRules: z.unknown(),
          referencePrice: z.unknown(),
          listPrice: z
            .object({
              price: z.unknown(),
              discount: z.unknown(),
              percentage: z.unknown(),
            })
            .partial()
            .passthrough(),
          regulationPrice: z
            .object({ price: z.unknown() })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough()
);
const StateMachineState: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      technicalName: z.string(),
      name: z.string(),
      stateMachineId: z.string().regex(/^[0-9a-f]{32}$/),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      translated: z.object({}).partial().passthrough().optional(),
      stateMachine: z.object({}).partial().passthrough().optional(),
      fromStateMachineTransitions: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      toStateMachineTransitions: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      orderTransactions: z.array(OrderTransaction).optional(),
      orderDeliveries: z.array(OrderDelivery).optional(),
      orders: z.array(Order).optional(),
      orderTransactionCaptures: z.array(OrderTransactionCapture).optional(),
      orderTransactionCaptureRefunds: z
        .array(OrderTransactionCaptureRefund)
        .optional(),
      toStateMachineHistoryEntries: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      fromStateMachineHistoryEntries: z
        .array(z.object({}).partial().passthrough())
        .optional(),
    })
    .passthrough()
);
const Salutation: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      salutationKey: z.string(),
      displayName: z.string(),
      letterName: z.string(),
      customFields: z.object({}).partial().passthrough().optional(),
      position: z.number().int().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      translated: z.object({}).partial().passthrough().optional(),
      customers: z.array(z.object({}).partial().passthrough()).optional(),
      customerAddresses: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      orderCustomers: z.array(OrderCustomer).optional(),
      orderAddresses: z.array(OrderAddress).optional(),
      newsletterRecipients: z
        .array(z.object({}).partial().passthrough())
        .optional(),
    })
    .passthrough()
);
const OrderCustomer: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      customerId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderId: z.string().regex(/^[0-9a-f]{32}$/),
      orderVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      email: z.string(),
      salutationId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      firstName: z.string(),
      lastName: z.string(),
      company: z.string().optional(),
      title: z.string().optional(),
      vatIds: z.array(z.string()).optional(),
      customerNumber: z.string().optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      remoteAddress: z.string().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      order: Order.optional(),
      customer: z.object({}).partial().passthrough().optional(),
      salutation: Salutation.optional(),
    })
    .passthrough()
);
const Currency: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      factor: z.number(),
      symbol: z.string(),
      isoCode: z.string(),
      shortName: z.string(),
      name: z.string(),
      position: z.number().int().optional(),
      isSystemDefault: z.boolean().optional(),
      taxFreeFrom: z.number().optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      itemRounding: z
        .object({
          decimals: z.number().int(),
          interval: z.number(),
          roundForNet: z.boolean(),
        })
        .passthrough(),
      totalRounding: z
        .object({
          decimals: z.number().int(),
          interval: z.number(),
          roundForNet: z.boolean(),
        })
        .passthrough(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      translated: z.object({}).partial().passthrough().optional(),
      salesChannelDefaultAssignments: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      orders: z.array(Order).optional(),
      salesChannels: z.array(z.object({}).partial().passthrough()).optional(),
      salesChannelDomains: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      promotionDiscountPrices: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      productExports: z.array(z.object({}).partial().passthrough()).optional(),
      countryRoundings: z
        .array(z.object({}).partial().passthrough())
        .optional(),
    })
    .passthrough()
);
const Order: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      autoIncrement: z.number().int().optional(),
      orderNumber: z.string().optional(),
      billingAddressId: z.string().regex(/^[0-9a-f]{32}$/),
      billingAddressVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      primaryOrderDeliveryId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      primaryOrderDeliveryVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      primaryOrderTransactionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      primaryOrderTransactionVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      currencyId: z.string().regex(/^[0-9a-f]{32}$/),
      languageId: z.string().regex(/^[0-9a-f]{32}$/),
      salesChannelId: z.string().regex(/^[0-9a-f]{32}$/),
      orderDateTime: z.string().datetime({ offset: true }),
      orderDate: z.string().optional(),
      price: z
        .object({
          netPrice: z.number(),
          totalPrice: z.number(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          positionPrice: z.number(),
          rawTotal: z.number(),
          taxStatus: z.string(),
        })
        .passthrough()
        .optional(),
      amountTotal: z.number().optional(),
      amountNet: z.number().optional(),
      positionPrice: z.number().optional(),
      taxStatus: z.string().optional(),
      shippingCosts: z
        .object({
          unitPrice: z.number(),
          totalPrice: z.number(),
          quantity: z.number().int(),
          calculatedTaxes: z.object({}).partial().passthrough().optional(),
          taxRules: z.object({}).partial().passthrough().optional(),
          referencePrice: z.object({}).partial().passthrough().optional(),
          listPrice: z
            .object({
              price: z.number(),
              discount: z.number(),
              percentage: z.number(),
            })
            .partial()
            .passthrough()
            .optional(),
          regulationPrice: z
            .object({ price: z.number() })
            .partial()
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      shippingTotal: z.number().optional(),
      currencyFactor: z.number(),
      deepLinkCode: z.string().optional(),
      affiliateCode: z.string().optional(),
      campaignCode: z.string().optional(),
      customerComment: z.string().optional(),
      internalComment: z.string().optional(),
      source: z.string().optional(),
      taxCalculationType: z.string().optional(),
      stateId: z.string().regex(/^[0-9a-f]{32}$/),
      ruleIds: z.array(z.string()).optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      createdById: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      updatedById: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      itemRounding: z
        .object({
          decimals: z.number().int(),
          interval: z.number(),
          roundForNet: z.boolean(),
        })
        .passthrough(),
      totalRounding: z
        .object({
          decimals: z.number().int(),
          interval: z.number(),
          roundForNet: z.boolean(),
        })
        .passthrough(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      extensions: z
        .object({
          salesChannelTracking: z
            .object({
              links: z.object({ related: z.string() }).partial().passthrough(),
              data: z
                .object({
                  type: z.string(),
                  id: z.string().regex(/^[0-9a-f]{32}$/),
                })
                .partial()
                .passthrough(),
            })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
      stateMachineState: StateMachineState.optional(),
      primaryOrderDelivery: OrderDelivery.optional(),
      primaryOrderTransaction: OrderTransaction.optional(),
      orderCustomer: OrderCustomer.optional(),
      currency: Currency.optional(),
      language: z.object({}).partial().passthrough().optional(),
      salesChannel: z.object({}).partial().passthrough().optional(),
      addresses: z.array(OrderAddress).optional(),
      billingAddress: OrderAddress.optional(),
      deliveries: z.array(OrderDelivery).optional(),
      lineItems: z.array(OrderLineItem).optional(),
      transactions: z.array(OrderTransaction).optional(),
      documents: z.array(z.object({}).partial().passthrough()).optional(),
      tags: z.array(z.object({}).partial().passthrough()).optional(),
      createdBy: z.object({}).partial().passthrough().optional(),
      updatedBy: z.object({}).partial().passthrough().optional(),
    })
    .passthrough()
);
const OrderAddress: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      versionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      countryId: z.string().regex(/^[0-9a-f]{32}$/),
      countryStateId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      orderId: z.string().regex(/^[0-9a-f]{32}$/),
      orderVersionId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      salutationId: z
        .string()
        .regex(/^[0-9a-f]{32}$/)
        .optional(),
      firstName: z.string(),
      lastName: z.string(),
      street: z.string(),
      zipcode: z.string().optional(),
      city: z.string(),
      company: z.string().optional(),
      department: z.string().optional(),
      title: z.string().optional(),
      phoneNumber: z.string().optional(),
      additionalAddressLine1: z.string().optional(),
      additionalAddressLine2: z.string().optional(),
      hash: z.string().optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      vatId: z.string().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      country: Country.optional(),
      countryState: CountryState.optional(),
      order: Order.optional(),
      orderDeliveries: z.array(OrderDelivery).optional(),
      salutation: Salutation.optional(),
    })
    .passthrough()
);
const Country: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      name: z.string(),
      iso: z.string().optional(),
      position: z.number().int().optional(),
      active: z.boolean().optional(),
      shippingAvailable: z.boolean().optional(),
      iso3: z.string().optional(),
      displayStateInRegistration: z.boolean().optional(),
      forceStateInRegistration: z.boolean().optional(),
      checkVatIdPattern: z.boolean().optional(),
      vatIdRequired: z.boolean().optional(),
      vatIdPattern: z.string().optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      customerTax: z
        .object({
          enabled: z.boolean(),
          currencyId: z.string(),
          amount: z.number(),
        })
        .passthrough()
        .optional(),
      companyTax: z
        .object({
          enabled: z.boolean(),
          currencyId: z.string(),
          amount: z.number(),
        })
        .passthrough()
        .optional(),
      postalCodeRequired: z.boolean().optional(),
      checkPostalCodePattern: z.boolean().optional(),
      checkAdvancedPostalCodePattern: z.boolean().optional(),
      advancedPostalCodePattern: z.string().optional(),
      addressFormat: z.object({}).partial().passthrough(),
      defaultPostalCodePattern: z.string().optional(),
      isEu: z.boolean().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      translated: z.object({}).partial().passthrough().optional(),
      states: z.array(CountryState).optional(),
      customerAddresses: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      orderAddresses: z.array(OrderAddress).optional(),
      salesChannelDefaultAssignments: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      salesChannels: z.array(z.object({}).partial().passthrough()).optional(),
      taxRules: z.array(z.object({}).partial().passthrough()).optional(),
      currencyCountryRoundings: z
        .array(z.object({}).partial().passthrough())
        .optional(),
    })
    .passthrough()
);
const CountryState: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      id: z.string().regex(/^[0-9a-f]{32}$/),
      countryId: z.string().regex(/^[0-9a-f]{32}$/),
      shortCode: z.string(),
      name: z.string(),
      position: z.number().int().optional(),
      active: z.boolean().optional(),
      customFields: z.object({}).partial().passthrough().optional(),
      createdAt: z.string().datetime({ offset: true }).optional(),
      updatedAt: z.string().datetime({ offset: true }).optional(),
      translated: z.object({}).partial().passthrough().optional(),
      country: Country.optional(),
      customerAddresses: z
        .array(z.object({}).partial().passthrough())
        .optional(),
      orderAddresses: z.array(OrderAddress).optional(),
    })
    .passthrough()
);

export const schemas = {
  OrderDelivery,
  OrderDeliveryPosition,
  OrderLineItemDownload,
  OrderLineItem,
  OrderTransactionCaptureRefundPosition,
  OrderTransactionCaptureRefund,
  OrderTransactionCapture,
  OrderTransaction,
  StateMachineState,
  Salutation,
  OrderCustomer,
  Currency,
  Order,
  OrderAddress,
  Country,
  CountryState,
};
