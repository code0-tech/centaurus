import {z} from 'zod';

export const AddressSchema = z.object({
    Name1: z.string().max(40),
    Name2: z.string().max(40).optional(),
    Name3: z.string().max(40).optional(),
    CountryCode: z.string().max(2),
    Province: z.string().max(40).optional(),
    City: z.string().max(40),
    Street: z.string().min(4),
    StreetNumber: z.string().max(40).optional(),
    ContactPerson: z.string().max(40).min(6).optional(),
    FixedLinePhonenumber: z.string().max(35).min(4).optional(),
    MobilePhonenumber: z.string().max(35).min(4).optional(),
    eMail: z.string().max(80).optional(),
    ZIPCode: z.string().max(10),
})

export type Address = z.infer<typeof AddressSchema>

export const ConsigneeSchema = z.object({
    ConsigneeID: z.string().max(40).optional(),
    CostCenter: z.string().max(80).optional(),
    Category: z.enum(["BUSINESS", "PRIVATE"]).optional(),
    Address: AddressSchema
})

export type Consignee = z.infer<typeof ConsigneeSchema>

export const ShipperSchema = z.object({
    AlternativeShipperAddress: AddressSchema.optional(),
    Address: AddressSchema.optional(),
})

export type Shipper = z.infer<typeof ShipperSchema>

export const InternalShipperSchema = ShipperSchema.extend({
    ContactID: z.string().optional()
})

export type InternalShipper = z.infer<typeof InternalShipperSchema>

export const UnitServiceSchema = z.array(z.object({
    Cash: z.object({
        Reason: z.string().max(160),
        Amount: z.number().min(1),
        Currency: z.string().max(3).min(3)
    }).optional(),
    AddonLiability: z.object({
        Amount: z.number().min(1),
        Currency: z.string().max(3).min(3),
        ParcelContent: z.string().max(255)
    }).optional(),
    HazardousGoods: z.object({
        HarzardousGood: z.array(
            z.object({
                Weight: z.number().min(1),
                GLSHazNo: z.string().max(8)
            }))
    }).optional(),
    ExWorks: z.object({}).optional(),
    LimitedQuantities: z.object({
        Weight: z.number().optional()
    }).optional()
})).optional()

export type UnitService = z.infer<typeof UnitServiceSchema>

// adding all service names
export const InternalUnitServiceSchema = z.array(z.object({
    Cash: z.object({
        serviceName: z.string("service_cash"),
        Reason: z.string(),
        Amount: z.number(),
        Currency: z.string()
    }).optional(),
    AddonLiability: z.object({
        serviceName: z.string("service_addonliability"),
        Amount: z.number(),
        Currency: z.string(),
        ParcelContent: z.string()
    }).optional(),
    HazardousGoods: z.object({
        serviceName: z.string("service_hazardousgoods"),
        HarzardousGood: z.array(
            z.object({
                Weight: z.number(),
                GLSHazNo: z.string()
            }))
    }),
    ExWorks: z.object({
        serviceName: z.string("service_exworks"),
    }).optional(),
    LimitedQuantities: z.object({
        serviceName: z.string("service_limitedquantities"),
        Weight: z.number().optional()
    }).optional()
})).optional()


export const ShipmentUnitSchema = z.array(
    z.object({
        ShipmentUnitReference: z.string().max(40).optional(),
        PartnerParcelNumber: z.string().max(50).optional(),
        Weight: z.number().min(0.10).max(99),
        Note1: z.string().max(50).optional(),
        Note2: z.string().max(50).optional(),
        Service: UnitServiceSchema,
    })
).min(1)

export type ShipmentUnit = z.infer<typeof ShipmentUnitSchema.element>

export const InternalShipmentUnitSchema = ShipmentUnitSchema.element.extend(
    {
        Service: InternalUnitServiceSchema.optional()
    }
).array().min(1)


export const ShipmentServiceSchema = z.array(z.object({
    Service: z.object({
        serviceName: z.string()
    }).optional(),
    ShopDelivery: z.object({
        ParcelShopID: z.string().max(50)
    }).optional(),
    ShopReturn: z.object({
        NumberOfLabels: z.number(),
        ReturnQR: z.enum(["PDF", "PNG", "ZPL"]).optional()
    }).optional(),
    Intercompany: z.object({
        Address: AddressSchema,
        NumberOfLabels: z.number().min(1),
        ExpectedWeight: z.number().min(1).optional()
    }).optional(),
    Exchange: z.object({
        Address: AddressSchema,
        ExpectedWeight: z.number().min(1).optional()
    }).optional(),
    DeliveryAtWork: z.object({
        RecipientName: z.string().max(40),
        AlternateRecipientName: z.string().max(40).optional(),
        Building: z.string().max(40),
        Floor: z.number(),
        Room: z.number().optional(),
        Phonenumber: z.string().max(35).optional()
    }).optional(),
    Deposit: z.object({
        PlaceOfDeposit: z.string().max(121),
    }).optional(),
    IdentPin: z.object({
        PIN: z.string().max(4),
        Birthdate: z.iso.date().optional()
    }).optional(),
    Ident: z.object({
        Birthdate: z.iso.date(),
        Firstname: z.string().max(40),
        Lastname: z.string().max(40),
        Nationality: z.string().max(2)
    }).optional(),
    PickAndShip: z.object({
        PickupDate: z.iso.date(),
    }).optional(),
    PickAndReturn: z.object({
        PickupDate: z.iso.date(),
    }).optional(),
    InboundLogistics: z.object().optional(),
    DocumentReturnService: z.object().optional(),
    CompleteDeliveryConsignmentService: z.object().optional(),
    FlexDeliveryService: z.object().optional(),
    SignatureService: z.object().optional(),
    T24Service: z.object().optional(),
    T48Service: z.object().optional(),
    Guaranteed24Service: z.object().optional(),
    AddresseeOnlyService: z.object().optional(),
    TyreService: z.object().optional(),
    '0800Service': z.object().optional(),
    '0900Service': z.object().optional(),
    '1000Service': z.object().optional(),
    '1200Service': z.object().optional(),
    '1300Service': z.object().optional(),
    EOB: z.object().optional(),
    Saturday1000Service: z.object().optional(),
    Saturday1200Service: z.object().optional(),
    SaturdayService: z.object().optional(),
})).optional()

export type ShipmentService = z.infer<typeof ShipmentServiceSchema>

export const InternalShipmentServiceSchema = z.array(z.object({
    Service: z.object({
        serviceName: z.string()
    }).optional(),
    ShopDelivery: z.object({
        serviceName: z.string().default("service_shopdelivery"),
        ParcelShopID: z.string().max(50)
    }).optional(),
    ShopReturn: z.object({
        serviceName: z.string().default("service_shopreturn"),
        NumberOfLabels: z.number(),
        ReturnQR: z.enum(["PDF", "PNG", "ZPL"]).optional()
    }).optional(),
    Intercompany: z.object({
        serviceName: z.string().default("service_intercompany"),
        Address: AddressSchema,
        NumberOfLabels: z.number().min(1),
        ExpectedWeight: z.number().min(1).optional()
    }).optional(),
    Exchange: z.object({
        serviceName: z.string().default("service_exchange"),
        Address: AddressSchema,
        ExpectedWeight: z.number().min(1).optional()
    }).optional(),
    DeliveryAtWork: z.object({
        serviceName: z.string().default("service_deliveryatwork"),
        RecipientName: z.string().max(40),
        AlternateRecipientName: z.string().max(40).optional(),
        Building: z.string().max(40),
        Floor: z.number(),
        Room: z.number().optional(),
        Phonenumber: z.string().max(35).optional()
    }).optional(),
    Deposit: z.object({
        serviceName: z.string().default("service_deposit"),
        PlaceOfDeposit: z.string().max(121),
    }).optional(),
    IdentPin: z.object({
        serviceName: z.string().default("service_identpin"),
        PIN: z.string().max(4),
        Birthdate: z.date().optional()
    }).optional(),
    Ident: z.object({
        serviceName: z.string().default("service_ident"),
        Birthdate: z.date(),
        Firstname: z.string().max(40),
        Lastname: z.string().max(40),
        Nationality: z.string().max(2)
    }).optional(),
    PickAndShip: z.object({
        serviceName: z.string().default("service_pickandship"),
        PickupDate: z.date(),
    }).optional(),
    PickAndReturn: z.object({
        serviceName: z.string().default("service_pickandreturn"),
        PickupDate: z.date(),
    }).optional(),
    InboundLogistics: z.object({
        serviceName: z.string().default("service_inbound"),
    }).optional(),
    DocumentReturnService: z.object({
        serviceName: z.string().default("service_documentreturn"),
    }).optional(),
    CompleteDeliveryConsignmentService: z.object({
        serviceName: z.string().default("service_completedeliveryconsignment"),
    }).optional(),
    FlexDeliveryConsignmentService: z.object({
        serviceName: z.string().default("service_flexdelivery"),
    }).optional(),
    SignatureService: z.object({
        serviceName: z.string().default("service_signature"),
    }).optional(),
    T24Service: z.object({
        serviceName: z.string().default("service_t24"),
    }).optional(),
    T48Service: z.object({
        serviceName: z.string().default("service_t48"),
    }).optional(),
    Guaranteed24Service: z.object({
        serviceName: z.string().default("service_guaranteed24"),
    }).optional(),
    AddresseeOnlyService: z.object({
        serviceName: z.string().default("service_addresseeonly"),
    }).optional(),
    TyreService: z.object({
        serviceName: z.string().default("service_tyre"),
    }).optional(),
    '0800Service': z.object({
        serviceName: z.string().default("service_0800"),
    }).optional(),
    '0900Service': z.object({
        serviceName: z.string().default("service_0900"),
    }).optional(),
    '1000Service': z.object({
        serviceName: z.string().default("service_1000"),
    }).optional(),
    '1200Service': z.object({
        serviceName: z.string().default("service_1200"),
    }).optional(),
    '1300Service': z.object({
        serviceName: z.string().default("service_1300"),
    }).optional(),
    Saturday1000Service: z.object({
        serviceName: z.string().default("service_saturday_1000"),
    }).optional(),
    Saturday1200Service: z.object({
        serviceName: z.string().default("service_saturday_1200"),
    }).optional(),
    SaturdayService: z.object({
        serviceName: z.string().default("service_Saturday"),
    }).optional(),
})).optional()

export const ShipmentSchema = z.object({
    ShipmentReference: z.string().max(40).optional(),
    ShipmentDate: z.date().optional(),
    IncotermCode: z.int().max(99).optional(),
    Identifier: z.string().max(40).optional(),
    Product: z.enum(["PARCEL", "EXPRESS"]),
    ExpressAltDeliveryAllowed: z.boolean().optional(),
    Consignee: ConsigneeSchema,
    Shipper: ShipperSchema.optional(),
    Carrier: z.enum(["ROYALMAIL"]).optional(),
    ShipmentUnit: ShipmentUnitSchema,
    Service: ShipmentServiceSchema,
    Return: z.object({
        Address: AddressSchema
    }).optional()
})

export const ShipmentWithoutServicesSchema = ShipmentSchema.omit({Service: true})

export type ShipmentWithoutServices = z.infer<typeof ShipmentWithoutServicesSchema>

export type Shipment = z.infer<typeof ShipmentSchema>

export const InternalShipmentSchma = ShipmentSchema.extend({
    Middleware: z.string().max(40),
    Shipper: InternalShipperSchema,
    Service: InternalShipmentServiceSchema,
    ShipmentUnit: InternalShipmentUnitSchema
})


export const PrintingOptionsSchema = z.object({
    ReturnLabels: z.object({
        TemplateSet: z.enum([
            "NONE", "D_200", "PF_4_I", "PF_4_I_200", "PF_4_I_300", "PF_8_D_200", "T_200_BF", "T_300_BF", "ZPL_200", "ZPL_200_TRACKID_EAN_128", "ZPL_200_TRACKID_CODE_39", "ZPL_200_REFNO_EAN_128", "ZPL_200_REFNO_CODE_39", "ZPL_300", "ZPL_300_TRACKID_EAN_128", "ZPL_300_TRACKID_CODE_39", "ZPL_300_REFNO_EAN_128", "ZPL_300_REFNO_CODE_39"
        ]),
        LabelFormat: z.enum(["PDF", "ZEBRA", "INTERMEC", "DATAMAX", "TOSHIBA", "PNG"])
    })
})

export type PrintingOptions = z.infer<typeof PrintingOptionsSchema>
export type ReturnLabels = z.infer<typeof PrintingOptionsSchema.shape.ReturnLabels>

export const ReturnOptionsSchema = z.object({
    ReturnPrintData: z.boolean().default(true).optional(),
    ReturnRoutingInfo: z.boolean().default(true).optional()
})

export type ReturnOptions = z.infer<typeof ReturnOptionsSchema>

export const CustomContentSchema = z.object({
    CustomerLogo: z.string(),
    BarcodeContentType: z.enum(["TRACK_ID", "GLS_SHIPMENT_REFERENCE"]),
    Barcode: z.string().optional(),
    BarcodeType: z.enum(["EAN_128", "CODE_39"]).optional(),
    HideShipperAddress: z.boolean().optional()
})

export type CustomContent = z.infer<typeof CustomContentSchema>

export const ShipmentRequestDataSchema = z.object({
    Shipment: ShipmentSchema,
    PrintingOptions: PrintingOptionsSchema,
    ReturnOptions: ReturnOptionsSchema.optional(),
    CustomContent: CustomContentSchema.optional(),
})


export const CreateShopDeliveryRequestDataSchema = z.object({
    ParcelShopID: z.string().max(50),
    Shipment: ShipmentWithoutServicesSchema,
    PrintingOptions: PrintingOptionsSchema,
    ReturnOptions: ReturnOptionsSchema.optional(),
    CustomContent: CustomContentSchema.optional(),
})

export type CreateShopDeliveryRequestData = z.infer<typeof CreateShopDeliveryRequestDataSchema>

export const InternalShipmentRequestDataSchema = ShipmentRequestDataSchema.extend({
    Shipment: InternalShipmentSchma,
})

export type InternalShipmentRequestData = z.infer<typeof InternalShipmentRequestDataSchema>

export type ShipmentRequestData = z.infer<typeof ShipmentRequestDataSchema>

export const CreateParcelsResponseSchema = z.object({
    CreatedShipment: z.object({
        ShipmentReference: z.array(z.string()),
        ParcelData: z.array(z.object({
            TrackID: z.string().min(8).max(8),
            ParcelNumber: z.string(),
            Barcodes: z.object({
                Primary2D: z.string(),
                Secondary2D: z.string(),
                Primary1D: z.string(),
                Primary1DPrint: z.boolean(),
            }),
            RoutingInfo: z.object({
                Tour: z.string(),
                InboundSortingFlag: z.string(),
                FinalLocationCode: z.string(),
                LastRoutingDate: z.iso.date(),
                HubLocation: z.string(),
            })
        })),
        PrintData: z.array(z.object({
            Data: z.string(),
            LabelFormat: z.enum(["PDF", "ZEBRA", "INTERMEC", "DATAMAX", "TOSHIBA", "PNG"])
        })),
        CustomerID: z.string(),
        PickupLocation: z.string(),
        GDPR: z.array(z.string())
    }),
})


export type CreateParcelsResponse = z.infer<typeof CreateParcelsResponseSchema>

export const CancelShipmentRequestDataSchema = z.object({
    TrackID: z.string()
})

export type CancelShipmentRequestData = z.infer<typeof CancelShipmentRequestDataSchema>

export const CancelShipmentResponseDataSchema = z.object({
    TrackID: z.string(),
    result: z.enum(["CANCELLED", "CANCELLATION_PENDING", "SCANNED", "ERROR"])
})

export type CancelShipmentResponseData = z.infer<typeof CancelShipmentResponseDataSchema>

export const AllowedServicesRequestDataSchema = z.object({
    Source: z.object({
        CountryCode: z.string().max(2),
        ZIPCode: z.string().max(10)
    }),
    Destination: z.object({
        CountryCode: z.string().max(2),
        ZIPCode: z.string().max(10)
    }),
    ContactID: z.string().optional()
})

export type AllowedServicesRequestData = z.infer<typeof AllowedServicesRequestDataSchema>

export const AllowedServicesResponseDataSchema = z.object({
    AllowedServices: z.array(z.union([
        z.object({
            ServiceName: z.string(),
        }).strict(),
        z.object({
            ProductName: z.string(),
        }).strict()
    ]))
})

export type AllowedServicesResponseData = z.infer<typeof AllowedServicesResponseDataSchema>

export const EndOfDayRequestDataSchema = z.object({
    date: z.iso.date()
})


export const EndOfDayResponseDataSchema = z.object({
    Shipments: z.array(z.object({
        ShippingDate: z.iso.date(),
        Product: z.enum(["PARCEL", "EXPRESS"]),
        Consignee: z.object({
            Address: AddressSchema
        }),
        Shipper: z.object({
            ContactID: z.string(),
            AlternativeShipperAddress: AddressSchema.optional(),
        }),
        ShipmentUnit: z.array(z.object({
            Weight: z.string(),
            TrackID: z.string(),
            ParcelNumber: z.string()
        })).optional()
    })).optional()
})

export type EndOfDayRequestData = z.infer<typeof EndOfDayRequestDataSchema>

export type EndOfDayResponseData = z.infer<typeof EndOfDayResponseDataSchema>

export const AuthenticationRequestDataSchema = z.object({
    grant_type: z.string().default("client_credentials"),
    client_id: z.string(),
    client_secret: z.string(),
    scope: z.string().optional()
})

export const UpdateParcelWeightRequestDataSchema = z.object({
    TrackID: z.string().max(8).optional(),
    ParcelNumber: z.number().max(999999999999).optional(),
    ShipmentReference: z.string().max(40).optional(),
    ShipmentUnitReference: z.string().max(40).optional(),
    PartnerParcelNumber: z.string().max(50).optional(),
    Weight: z.number().min(0.10)
})
export type UpdateParcelWeightRequestData = z.infer<typeof UpdateParcelWeightRequestDataSchema>

export const UpdateParcelWeightResponseDataSchema = z.object({
    UpdatedWeight: z.string()
})

export type UpdateParcelWeightResponseData = z.infer<typeof UpdateParcelWeightResponseDataSchema>

export const ReprintParcelRequestDataSchema = z.object({
    TrackID: z.string().max(8).optional(),
    ParcelNumber: z.number().max(999999999999).optional(),
    ShipmentReference: z.string().max(40).optional(),
    ShipmentUnitReference: z.string().max(40).optional(),
    PartnerParcelNumber: z.string().max(50).optional(),
    CreationDate: z.iso.date(),
    PrintingOptions: z.object({
        ReturnLabels: z.object({
            TemplateSet: z.enum(["NONE", "ZPL_200", "ZPL_300"]),
            LabelFormat: z.enum(["PDF", "ZEBRA", "PNG", "PNG_200"])
        })
    })
})
export type ReprintParcelRequestData = z.infer<typeof ReprintParcelRequestDataSchema>

export const ReprintParcelResponseDataSchema = z.object({
    CreatedShipment: z.object({
        ParcelData: z.array(z.object({
            TrackID: z.string().min(8).max(8),
            ShipmentUnitReference: z.array(z.string()).optional(),
            ParcelNumber: z.string(),
            Barcodes: z.object({
                Primary2D: z.string(),
                Secondary2D: z.string(),
                Primary1D: z.string(),
                Primary1DPrint: z.boolean(),
            }),
            RoutingInfo: z.object({
                Tour: z.string(),
                InboundSortingFlag: z.string(),
                FinalLocationCode: z.string(),
                LastRoutingDate: z.iso.date(),
                HubLocation: z.string(),
            })
        })),
        PrintData: z.array(z.object({
            Data: z.string(),
            LabelFormat: z.enum(["PDF", "ZEBRA", "PNG", "PNG_200"])
        })),
        CustomerID: z.string(),
        PickupLocation: z.string(),
        GDPR: z.array(z.string())
    })
})

export type ReprintParcelResponseData = z.infer<typeof ReprintParcelResponseDataSchema>


export const InternalValidateShipmentRequestDataSchema = z.object({
    Shipment: InternalShipmentSchma,
})

export type InternalValidateShipmentRequestData = z.infer<typeof InternalValidateShipmentRequestDataSchema>

export const ValidateShipmentRequestDataSchema = z.object({
    Shipment: ShipmentSchema,
})

export type ValidateShipmentRequestData = z.infer<typeof ValidateShipmentRequestDataSchema>

export const ValidateShipmentResponseDataSchema = z.object({
    success: z.boolean(),
    validationResult: z.object({
        Issues: z.array(z.object({
            Rule: z.string(),
            Location: z.string(),
            Parameters: z.array(z.string()).optional()
        }))
    })
})

export type ValidateShipmentResponseData = z.infer<typeof ValidateShipmentResponseDataSchema>

export type AuthenticationRequestData = z.infer<typeof AuthenticationRequestDataSchema>

export const AuthenticationResponseDataSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
})

export type AuthenticationResponseData = z.infer<typeof AuthenticationResponseDataSchema>