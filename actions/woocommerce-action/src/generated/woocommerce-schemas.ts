import { z } from "zod";

const Billing = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address_1: z.string(),
    address_2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
    email: z.string(),
    phone: z.string(),
  })
  .partial()
  .passthrough();
const Shipping = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address_1: z.string(),
    address_2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
    phone: z.string(),
  })
  .partial()
  .passthrough();
const MetaData = z
  .object({
    id: z.number().int(),
    key: z.string(),
    value: z.object({}).partial().passthrough(),
    display_key: z.string(),
    display_value: z.object({}).partial().passthrough(),
  })
  .partial()
  .passthrough();
const Customer = z
  .object({
    id: z.number().int(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    date_modified: z.string().datetime({ offset: true }),
    date_modified_gmt: z.string().datetime({ offset: true }),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    role: z.string(),
    username: z.string(),
    password: z.string(),
    billing: Billing,
    shipping: Shipping,
    is_paying_customer: z.boolean(),
    avatar_url: z.string(),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const ApiError = z
  .object({
    code: z.string(),
    message: z.string(),
    data: z.object({ status: z.number().int() }).partial().passthrough(),
  })
  .partial()
  .passthrough();
const batchCustomers_Body = z
  .object({
    create: z.array(Customer),
    update: z.array(Customer),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const ProductDownload = z
  .object({ id: z.string(), name: z.string(), file: z.string() })
  .partial()
  .passthrough();
const ProductDimension = z
  .object({ length: z.string(), width: z.string(), height: z.string() })
  .partial()
  .passthrough();
const ProductCategoriesItem = z
  .object({ id: z.number().int(), name: z.string(), slug: z.string() })
  .partial()
  .passthrough();
const ProductTag = z
  .object({
    id: z.number().int().optional(),
    name: z.string(),
    slug: z.string().optional(),
    description: z.string().optional(),
    count: z.number().int().optional(),
  })
  .passthrough();
const ProductImage = z
  .object({
    id: z.number().int(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    date_modified: z.string().datetime({ offset: true }),
    date_modified_gmt: z.string().datetime({ offset: true }),
    src: z.string(),
    name: z.string(),
    alt: z.string(),
  })
  .partial()
  .passthrough();
const ProductAttribute = z
  .object({
    id: z.number().int(),
    name: z.string(),
    option: z.string(),
    slug: z.string(),
    type: z.string(),
    order_by: z.string(),
    has_archives: z.boolean(),
  })
  .partial()
  .passthrough();
const Product = z
  .object({
    id: z.number().int(),
    name: z.string(),
    slug: z.string(),
    permalink: z.string(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    date_modified: z.string().datetime({ offset: true }),
    date_modified_gmt: z.string().datetime({ offset: true }),
    type: z.string(),
    status: z.string(),
    featured: z.boolean(),
    catalog_visibility: z.string(),
    description: z.string(),
    short_description: z.string(),
    sku: z.string(),
    price: z.string(),
    regular_price: z.string(),
    sale_price: z.string(),
    date_on_sale_from: z.string().datetime({ offset: true }),
    date_on_sale_from_gmt: z.string().datetime({ offset: true }),
    date_on_sale_to: z.string().datetime({ offset: true }),
    date_on_sale_to_gmt: z.string().datetime({ offset: true }),
    price_html: z.string(),
    on_sale: z.boolean(),
    purchasable: z.boolean(),
    total_sales: z.number().int(),
    virtual: z.boolean(),
    downloadable: z.boolean(),
    downloads: z.array(ProductDownload),
    download_limit: z.number().int(),
    download_expiry: z.number().int(),
    external_url: z.string(),
    button_text: z.string(),
    tax_status: z.string(),
    tax_class: z.string(),
    manage_stock: z.boolean(),
    stock_quantity: z.number().int(),
    stock_status: z.string(),
    backorders: z.string(),
    backorders_allowed: z.boolean(),
    backordered: z.boolean(),
    sold_individually: z.boolean(),
    weight: z.string(),
    dimensions: ProductDimension,
    shipping_required: z.boolean(),
    shipping_taxable: z.boolean(),
    shipping_class: z.string(),
    shipping_class_id: z.number().int(),
    reviews_allowed: z.boolean(),
    average_rating: z.string(),
    rating_count: z.number().int(),
    related_ids: z.array(z.number().int()),
    upsell_ids: z.array(z.number().int()),
    cross_sell_ids: z.array(z.number().int()),
    parent_id: z.number().int(),
    purchase_note: z.string(),
    categories: z.array(ProductCategoriesItem),
    tags: z.array(ProductTag),
    images: z.array(ProductImage),
    attributes: z.array(ProductAttribute),
    default_attributes: z.array(ProductAttribute),
    variations: z.array(z.number().int()),
    grouped_products: z.array(z.number().int()),
    menu_order: z.number().int(),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const batchProducts_Body = z
  .object({
    create: z.array(Product),
    update: z.array(Product),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const ProductVariation = z
  .object({
    id: z.number().int(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    date_modified: z.string().datetime({ offset: true }),
    date_modified_gmt: z.string().datetime({ offset: true }),
    description: z.string(),
    permalink: z.string(),
    sku: z.string(),
    price: z.string(),
    regular_price: z.string(),
    sale_price: z.string(),
    date_on_sale_from: z.string().datetime({ offset: true }),
    date_on_sale_from_gmt: z.string().datetime({ offset: true }),
    date_on_sale_to: z.string().datetime({ offset: true }),
    date_on_sale_to_gmt: z.string().datetime({ offset: true }),
    on_sale: z.boolean(),
    status: z.string(),
    purchasable: z.boolean(),
    virtual: z.boolean(),
    downloadable: z.boolean(),
    downloads: z.array(ProductDownload),
    download_limit: z.number().int(),
    download_expiry: z.number().int(),
    tax_status: z.string(),
    tax_class: z.string(),
    manage_stock: z.boolean(),
    stock_quantity: z.number().int(),
    stock_status: z.string(),
    backorders: z.string(),
    backorders_allowed: z.boolean(),
    backordered: z.boolean(),
    weight: z.string(),
    dimensions: ProductDimension,
    shipping_class: z.string(),
    shipping_class_id: z.number().int(),
    image: ProductImage,
    attributes: z.array(ProductAttribute),
    menu_order: z.number().int(),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const batchProductVariations_Body = z
  .object({
    create: z.array(ProductVariation),
    update: z.array(ProductVariation),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const batchUpdateProductAttributes_Body = z
  .object({
    create: z.array(ProductAttribute),
    update: z.array(ProductAttribute),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const ProductAttributeTerm = z
  .object({
    id: z.number().int(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    menu_order: z.number().int(),
    count: z.number().int(),
  })
  .partial()
  .passthrough();
const batchUpdateAttributeTerms_Body = z
  .object({
    create: z.array(ProductAttributeTerm),
    update: z.array(ProductAttributeTerm),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const ProductCategory = z
  .object({
    id: z.number().int().optional(),
    name: z.string(),
    slug: z.string().optional(),
    parent: z.number().int().optional(),
    description: z.string().optional(),
    display: z
      .enum(["default", "products", "subcategories", "both"])
      .optional()
      .default("default"),
    image: ProductImage.optional(),
    menu_order: z.number().int().optional(),
    count: z.number().int().optional(),
  })
  .passthrough();
const batchProductCategories_Body = z
  .object({
    create: z.array(ProductCategory),
    update: z.array(ProductCategory),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const ProductShippingClass = z
  .object({
    id: z.number().int(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    count: z.number().int(),
  })
  .partial()
  .passthrough();
const batchUpdateShippingClasses_Body = z
  .object({
    create: z.array(ProductShippingClass),
    update: z.array(ProductShippingClass),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const batchProductTags_Body = z
  .object({
    create: z.array(ProductTag),
    update: z.array(ProductTag),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const OrderTaxLine = z
  .object({
    id: z.number().int(),
    rate_code: z.string(),
    rate_id: z.string(),
    label: z.string(),
    compound: z.boolean(),
    tax_total: z.string(),
    shipping_tax_total: z.string(),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const OrderLineItem = z
  .object({
    id: z.number().int(),
    name: z.string(),
    parent_name: z.string(),
    product_id: z.number().int(),
    variation_id: z.number().int(),
    quantity: z.number().int(),
    tax_class: z.string(),
    subtotal: z.string(),
    subtotal_tax: z.string(),
    total: z.string(),
    total_tax: z.string(),
    taxes: z.array(OrderTaxLine),
    meta_data: z.array(MetaData),
    sku: z.string(),
    price: z.number(),
  })
  .partial()
  .passthrough();
const OrderShippingLine = z
  .object({
    id: z.number().int(),
    method_title: z.string(),
    method_id: z.string(),
    instance_id: z.string(),
    total: z.string(),
    total_tax: z.string(),
    taxes: z.array(OrderTaxLine),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const OrderFeeLine = z
  .object({
    id: z.number().int(),
    name: z.string(),
    tax_class: z.string(),
    tax_status: z.string(),
    total: z.string(),
    total_tax: z.string(),
    taxes: z.array(OrderTaxLine),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const OrderCouponLine = z
  .object({
    id: z.number().int(),
    code: z.string(),
    discount: z.string(),
    discount_tax: z.string(),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const OrderRefund = z
  .object({
    id: z.number().int(),
    reason: z.string(),
    total: z.string(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    amount: z.string(),
    api_refund: z.boolean(),
    line_items: z.array(
      z
        .object({
          id: z.number().int(),
          name: z.string(),
          product_id: z.number().int(),
          variation_id: z.number().int(),
          quantity: z.number().int(),
          tax_class: z.string(),
          subtotal: z.string(),
          subtotal_tax: z.string(),
          total: z.string(),
          total_tax: z.string(),
          taxes: z.array(
            z
              .object({
                id: z.number().int(),
                total: z.string(),
                subtotal: z.string(),
              })
              .partial()
              .passthrough()
          ),
          meta_data: z.array(MetaData),
          sku: z.string(),
          price: z.number(),
        })
        .partial()
        .passthrough()
    ),
    refunded_by: z.number().int(),
    refunded_payment: z.boolean(),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const Order = z
  .object({
    id: z.number().int(),
    parent_id: z.number().int(),
    number: z.string(),
    order_key: z.string(),
    created_via: z.string(),
    version: z.string(),
    status: z.string(),
    currency: z.enum([
      "AED",
      "AFN",
      "ALL",
      "AMD",
      "ANG",
      "AOA",
      "ARS",
      "AUD",
      "AWG",
      "AZN",
      "BAM",
      "BBD",
      "BDT",
      "BGN",
      "BHD",
      "BIF",
      "BMD",
      "BND",
      "BOB",
      "BRL",
      "BSD",
      "BTC",
      "BTN",
      "BWP",
      "BYR",
      "BYN",
      "BZD",
      "CAD",
      "CDF",
      "CHF",
      "CLP",
      "CNY",
      "COP",
      "CRC",
      "CUC",
      "CUP",
      "CVE",
      "CZK",
      "DJF",
      "DKK",
      "DOP",
      "DZD",
      "EGP",
      "ERN",
      "ETB",
      "EUR",
      "FJD",
      "FKP",
      "GBP",
      "GEL",
      "GGP",
      "GHS",
      "GIP",
      "GMD",
      "GNF",
      "GTQ",
      "GYD",
      "HKD",
      "HNL",
      "HRK",
      "HTG",
      "HUF",
      "IDR",
      "ILS",
      "IMP",
      "INR",
      "IQD",
      "IRR",
      "IRT",
      "ISK",
      "JEP",
      "JMD",
      "JOD",
      "JPY",
      "KES",
      "KGS",
      "KHR",
      "KMF",
      "KPW",
      "KRW",
      "KWD",
      "KYD",
      "KZT",
      "LAK",
      "LBP",
      "LKR",
      "LRD",
      "LSL",
      "LYD",
      "MAD",
      "MDL",
      "MGA",
      "MKD",
      "MMK",
      "MNT",
      "MOP",
      "MRU",
      "MUR",
      "MVR",
      "MWK",
      "MXN",
      "MYR",
      "MZN",
      "NAD",
      "NGN",
      "NIO",
      "NOK",
      "NPR",
      "NZD",
      "OMR",
      "PAB",
      "PEN",
      "PGK",
      "PHP",
      "PKR",
      "PLN",
      "PRB",
      "PYG",
      "QAR",
      "RON",
      "RSD",
      "RUB",
      "RWF",
      "SAR",
      "SBD",
      "SCR",
      "SDG",
      "SEK",
      "SGD",
      "SHP",
      "SLL",
      "SOS",
      "SRD",
      "SSP",
      "STN",
      "SYP",
      "SZL",
      "THB",
      "TJS",
      "TMT",
      "TND",
      "TOP",
      "TRY",
      "TTD",
      "TWD",
      "TZS",
      "UAH",
      "UGX",
      "USD",
      "UYU",
      "UZS",
      "VEF",
      "VES",
      "VND",
      "VUV",
      "WST",
      "XAF",
      "XCD",
      "XOF",
      "XPF",
      "YER",
      "ZAR",
      "ZMW",
    ]),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    date_modified: z.string().datetime({ offset: true }),
    date_modified_gmt: z.string().datetime({ offset: true }),
    discount_total: z.string(),
    discount_tax: z.string(),
    shipping_total: z.string(),
    shipping_tax: z.string(),
    cart_tax: z.string(),
    total: z.string(),
    total_tax: z.string(),
    prices_include_tax: z.boolean(),
    customer_id: z.number().int(),
    customer_ip_address: z.string(),
    customer_user_agent: z.string(),
    customer_note: z.string(),
    billing: Billing,
    shipping: Shipping,
    payment_method: z.string(),
    payment_method_title: z.string(),
    transaction_id: z.string(),
    date_paid: z.string().datetime({ offset: true }),
    date_paid_gmt: z.string().datetime({ offset: true }),
    date_completed: z.string().datetime({ offset: true }),
    date_completed_gmt: z.string().datetime({ offset: true }),
    cart_hash: z.string(),
    meta_data: z.array(MetaData),
    line_items: z.array(OrderLineItem),
    tax_lines: z.array(OrderTaxLine),
    shipping_lines: z.array(OrderShippingLine),
    fee_lines: z.array(OrderFeeLine),
    coupon_lines: z.array(OrderCouponLine),
    refunds: z.array(OrderRefund),
    set_paid: z.boolean(),
  })
  .partial()
  .passthrough();
const batchOrders_Body = z
  .object({
    create: z.array(Order),
    update: z.array(Order),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const OrderNote = z
  .object({
    id: z.number().int(),
    author: z.string(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    note: z.string(),
    customer_note: z.boolean(),
  })
  .partial()
  .passthrough();
const ProductReview = z
  .object({
    id: z.number().int(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    product_id: z.number().int(),
    status: z
      .enum(["approved", "hold", "spam", "unspam", "trash", "untrash"])
      .default("approved"),
    reviewer: z.string(),
    reviewer_email: z.string().email(),
    review: z.string(),
    rating: z.number().int().gte(0).lte(5),
    verified: z.boolean(),
  })
  .partial()
  .passthrough();
const batchUpdateProductReviews_Body = z
  .object({
    create: z.array(ProductReview),
    update: z.array(ProductReview),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const ReportListItem = z
  .object({
    slug: z.string(),
    description: z.string(),
    _links: z
      .object({
        self: z.array(z.object({ href: z.string() }).partial().passthrough()),
        collection: z.array(
          z.object({ href: z.string() }).partial().passthrough()
        ),
      })
      .partial()
      .passthrough(),
  })
  .partial()
  .passthrough();
const ReportTopSellersItem = z
  .object({
    title: z.string(),
    product_id: z.number().int(),
    quantity: z.number().int(),
  })
  .partial()
  .passthrough();
const ReportTotalsItem = z
  .object({ slug: z.string(), name: z.string(), total: z.string() })
  .partial()
  .passthrough();
const ReportOrderTotalSummary = z
  .object({ slug: z.string(), name: z.string(), total: z.number().int() })
  .partial()
  .passthrough();
const ReportSalesSummaryItem = z
  .object({
    sales: z.string(),
    orders: z.number().int(),
    items: z.number().int(),
    tax: z.string(),
    shipping: z.string(),
    discount: z.string(),
    customers: z.number().int(),
  })
  .partial()
  .passthrough();
const ReportSalesSummary = z
  .object({
    total_sales: z.string(),
    net_sales: z.string(),
    average_sales: z.string(),
    total_orders: z.number().int(),
    total_items: z.number().int(),
    total_tax: z.string(),
    total_shipping: z.string(),
    total_refunds: z.number(),
    total_discount: z.string(),
    totals_grouped_by: z.string(),
    total_customers: z.number().int(),
    totals: z.record(z.string(), ReportSalesSummaryItem),
  })
  .partial()
  .passthrough();
const Coupon = z
  .object({
    id: z.number().int(),
    code: z.string(),
    amount: z.string(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    date_modified: z.string().datetime({ offset: true }),
    date_modified_gmt: z.string().datetime({ offset: true }),
    discount_type: z
      .enum(["percent", "fixed_cart", "fixed_product"])
      .default("fixed_cart"),
    description: z.string(),
    date_expires: z.string().datetime({ offset: true }),
    date_expires_gmt: z.string().datetime({ offset: true }),
    usage_count: z.number().int(),
    individual_use: z.boolean().default(false),
    product_ids: z.array(z.number().int()),
    excluded_product_ids: z.array(z.number().int()),
    usage_limit: z.number().int(),
    usage_limit_per_user: z.number().int(),
    limit_usage_to_x_items: z.number().int(),
    free_shipping: z.boolean().default(false),
    product_categories: z.array(z.number().int()),
    excluded_product_categories: z.array(z.number().int()),
    exclude_sale_items: z.boolean().default(false),
    minimum_amount: z.string(),
    maximum_amount: z.string(),
    email_restrictions: z.array(z.string()),
    meta_data: z.array(MetaData),
  })
  .partial()
  .passthrough();
const batchCoupons_Body = z
  .object({
    create: z.array(Coupon),
    update: z.array(Coupon),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const SettingsGroup = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    parent_id: z.string(),
    sub_groups: z.string(),
  })
  .partial()
  .passthrough();
const Setting = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    value: z.string(),
    default: z.string(),
    tip: z.string(),
    type: z.string(),
    options: z.object({}).partial().passthrough(),
  })
  .partial()
  .passthrough();
const ShippingZone = z
  .object({
    id: z.number().int(),
    name: z.string(),
    order: z.number().int(),
    _links: z
      .object({
        self: z.array(z.object({ href: z.string() }).partial().passthrough()),
        collection: z.array(
          z.object({ href: z.string() }).partial().passthrough()
        ),
      })
      .partial()
      .passthrough(),
  })
  .partial()
  .passthrough();
const ShippingZoneLocation = z
  .object({
    code: z.string(),
    type: z.enum(["postcode", "state", "country", "continent"]),
  })
  .partial()
  .passthrough();
const ShippingZoneMethod = z
  .object({
    id: z.number().int(),
    instance_id: z.number().int(),
    title: z.string(),
    order: z.number().int(),
    enabled: z.boolean(),
    method_id: z.string(),
    method_title: z.string(),
    method_description: z.string(),
    settings: z.object({}).partial().passthrough(),
  })
  .partial()
  .passthrough();
const PaymentGateway = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    order: z.number().int(),
    enabled: z.boolean(),
    method_title: z.string(),
    method_description: z.string(),
    method_supports: z.array(z.string()),
    settings: z.object({}).partial().passthrough(),
  })
  .partial()
  .passthrough();
const Tax = z
  .object({
    id: z.number().int(),
    country: z.string(),
    state: z.string(),
    postcode: z.string(),
    city: z.string(),
    rate: z.string(),
    name: z.string(),
    priority: z.number().int().default(1),
    compound: z.boolean().default(false),
    shipping: z.boolean().default(true),
    order: z.number().int().default(0),
    class: z.string().default("standard"),
  })
  .partial()
  .passthrough();
const batchTaxes_Body = z
  .object({
    create: z.array(Tax),
    update: z.array(Tax),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const TaxClass = z
  .object({ slug: z.string(), name: z.string() })
  .partial()
  .passthrough();
const Webhook = z
  .object({
    id: z.number().int(),
    name: z.string(),
    status: z.enum(["active", "paused", "disabled"]).default("active"),
    topic: z.string(),
    resource: z.string(),
    event: z.string(),
    hooks: z.array(z.string()),
    delivery_url: z.string().url(),
    secret: z.string(),
    date_created: z.string().datetime({ offset: true }),
    date_created_gmt: z.string().datetime({ offset: true }),
    date_modified: z.string().datetime({ offset: true }),
    date_modified_gmt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const batchWebhooks_Body = z
  .object({
    create: z.array(Webhook),
    update: z.array(Webhook),
    delete: z.array(z.number().int()),
  })
  .partial()
  .passthrough();
const SystemStatus = z
  .object({
    environment: z.object({}).partial().passthrough(),
    database: z.object({}).partial().passthrough(),
    active_plugins: z.array(z.object({}).partial().passthrough()),
    inactive_plugins: z.array(z.object({}).partial().passthrough()),
    dropins_mu_plugins: z.array(z.object({}).partial().passthrough()),
    theme: z.object({}).partial().passthrough(),
    settings: z.object({}).partial().passthrough(),
    security: z.object({}).partial().passthrough(),
    pages: z.array(z.object({}).partial().passthrough()),
  })
  .partial()
  .passthrough();
const SystemStatusTool = z
  .object({
    id: z.string(),
    name: z.string(),
    action: z.string(),
    description: z.string(),
    success: z.boolean(),
    message: z.string(),
  })
  .partial()
  .passthrough();

export const schemas = {
  Billing,
  Shipping,
  MetaData,
  Customer,
  ApiError,
  batchCustomers_Body,
  ProductDownload,
  ProductDimension,
  ProductCategoriesItem,
  ProductTag,
  ProductImage,
  ProductAttribute,
  Product,
  batchProducts_Body,
  ProductVariation,
  batchProductVariations_Body,
  batchUpdateProductAttributes_Body,
  ProductAttributeTerm,
  batchUpdateAttributeTerms_Body,
  ProductCategory,
  batchProductCategories_Body,
  ProductShippingClass,
  batchUpdateShippingClasses_Body,
  batchProductTags_Body,
  OrderTaxLine,
  OrderLineItem,
  OrderShippingLine,
  OrderFeeLine,
  OrderCouponLine,
  OrderRefund,
  Order,
  batchOrders_Body,
  OrderNote,
  ProductReview,
  batchUpdateProductReviews_Body,
  ReportListItem,
  ReportTopSellersItem,
  ReportTotalsItem,
  ReportOrderTotalSummary,
  ReportSalesSummaryItem,
  ReportSalesSummary,
  Coupon,
  batchCoupons_Body,
  SettingsGroup,
  Setting,
  ShippingZone,
  ShippingZoneLocation,
  ShippingZoneMethod,
  PaymentGateway,
  Tax,
  batchTaxes_Body,
  TaxClass,
  Webhook,
  batchWebhooks_Body,
  SystemStatus,
  SystemStatusTool,
};
