import {
    createSdk, HerculesActionProjectConfiguration,
    HerculesFunctionContext,
    HerculesRuntimeFunctionDefinition,
    RuntimeErrorException
} from "@code0-tech/hercules"
import {
    cancelShipment, getAllowedServices, getEndOfDayInfo,
    postShipmentHelper,
    reprintParcel, updateParcelWeight,
    validateShipment,
    zodSchemaToTypescriptDefs
} from "./helpers";
import {
    Address,
    AddressSchema,
    AllowedServicesRequestData,
    AllowedServicesRequestDataSchema,
    AllowedServicesResponseData,
    AllowedServicesResponseDataSchema,
    CancelShipmentRequestData,
    CancelShipmentRequestDataSchema,
    CancelShipmentResponseData,
    CancelShipmentResponseDataSchema,
    Consignee,
    ConsigneeSchema,
    CreateParcelsResponse,
    CreateParcelsResponseSchema,
    CreateShopDeliveryRequestDataSchema,
    CustomContent,
    CustomContentSchema,
    EndOfDayRequestData,
    EndOfDayRequestDataSchema,
    EndOfDayResponseData,
    PrintingOptions,
    PrintingOptionsSchema,
    ReprintParcelRequestData,
    ReprintParcelRequestDataSchema,
    ReprintParcelResponseData,
    ReprintParcelResponseDataSchema,
    ReturnLabels,
    ReturnOptions,
    ReturnOptionsSchema,
    ShipmentRequestDataSchema,
    ShipmentSchema,
    ShipmentServiceSchema,
    ShipmentUnit,
    ShipmentUnitSchema,
    ShipmentWithoutServices,
    ShipmentWithoutServicesSchema,
    ShipperSchema, UnitService,
    UnitServiceSchema,
    UpdateParcelWeightRequestData,
    UpdateParcelWeightRequestDataSchema,
    UpdateParcelWeightResponseData,
    UpdateParcelWeightResponseDataSchema,
    ValidateShipmentRequestData,
    ValidateShipmentRequestDataSchema,
    ValidateShipmentResponseData,
    ValidateShipmentResponseDataSchema
} from "./types";

const sdk = createSdk({
    authToken: process.env.HERCULES_AUTH_TOKEN || "",
    aquilaUrl: process.env.HERCULES_AQUILA_URL || "127.0.0.1:50051",
    actionId: process.env.HERCULES_ACTION_ID || "gls-action",
    version: process.env.HERCULES_SDK_VERSION || "0.0.0",
})

let types: Map<string, string>

types = new Map([
    ...zodSchemaToTypescriptDefs(
        "GLS_SHIPMENT_WITHOUT_SERVICES",
        ShipmentWithoutServicesSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_SHIPMENT_REQUEST_DATA",
        ShipmentRequestDataSchema,
        {
            GLS_ADDRESS: AddressSchema,
            GLS_CONSIGNEE: ConsigneeSchema,
            GLS_UNIT_SERVICE: UnitServiceSchema,
            GLS_SHIPMENT_UNIT: ShipmentUnitSchema,
            GLS_SHIPPER: ShipperSchema,
            GLS_SHIPMENT_SERVICE: ShipmentServiceSchema,
            GLS_SHIPMENT: ShipmentSchema,
            GLS_PRINTING_OPTIONS: PrintingOptionsSchema,
            GLS_RETURN_OPTIONS: ReturnOptionsSchema,
            GLS_CUSTOM_CONTENT: CustomContentSchema,
        }
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_CREATE_PARCELS_RESPONSE",
        CreateParcelsResponseSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_CANCEL_SHIPMENT_REQUEST_DATA",
        CancelShipmentRequestDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_CANCEL_SHIPMENT_RESPONSE_DATA",
        CancelShipmentResponseDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_ALLOWED_SERVICES_REQUEST_DATA",
        AllowedServicesRequestDataSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_ALLOWED_SERVICES_RESPONSE_DATA",
        AllowedServicesResponseDataSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_END_OF_DAY_REQUEST_DATA",
        EndOfDayRequestDataSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_END_OF_DAY_RESPONSE_DATA",
        EndOfDayRequestDataSchema,
        {
            GLS_ADDRESS: AddressSchema
        }
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA",
        UpdateParcelWeightRequestDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA",
        UpdateParcelWeightResponseDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_REPRINT_PARCEL_REQUEST_DATA",
        ReprintParcelRequestDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_REPRINT_PARCEL_RESPONSE_DATA",
        ReprintParcelResponseDataSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
        ValidateShipmentRequestDataSchema,
        {
            GLS_SHIPMENT: ShipmentSchema
        }
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
        ValidateShipmentResponseDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "RETURN_LABELS",
        PrintingOptionsSchema.shape.ReturnLabels,
    ),
    ...zodSchemaToTypescriptDefs(
        "CREATE_SHOP_DELIVERY_REQUEST_DATA",
        CreateShopDeliveryRequestDataSchema,
        {
            GLS_ADDRESS: AddressSchema,
            GLS_CONSIGNEE: ConsigneeSchema,
            GLS_UNIT_SERVICE: UnitServiceSchema,
            GLS_SHIPMENT_UNIT: ShipmentUnitSchema,
            GLS_SHIPPER: ShipperSchema,
            GLS_SHIPMENT_SERVICE: ShipmentServiceSchema,
            GLS_SHIPMENT: ShipmentSchema,
            GLS_PRINTING_OPTIONS: PrintingOptionsSchema,
            GLS_RETURN_OPTIONS: ReturnOptionsSchema,
            GLS_CUSTOM_CONTENT: CustomContentSchema,
        }
    )
])

const defaultSignatureForServices = "shipment: GLS_SHIPMENT, printingOptions: GLS_PRINTING_OPTIONS, returnOptions?: GLS_RETURN_OPTIONS, customContent?: GLS_CUSTOM_CONTENT"
const defaultParametersForServices: HerculesRuntimeFunctionDefinition["parameters"] = [
    {
        runtimeName: "shipment",
        name: [
            {
                code: "en-US",
                content: "Shipment",
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The shipment for which to create the parcels. Must include all necessary information and services for the shipment.",
            }
        ]
    },
    {
        runtimeName: "printingOptions",
        name: [
            {
                code: "en-US",
                content: "Printing options",
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The printing options for the shipment. Specifies options for the labels to be printed for the shipment.",
            }
        ]
    },
    {
        runtimeName: "returnOptions",
        name: [
            {
                code: "en-US",
                content: "Return options",
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The return options for the shipment. Specifies options for return shipments.",
            }
        ]
    },
    {
        runtimeName: "customContent",
        name: [
            {
                code: "en-US",
                content: "Custom content",
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The custom content for the shipment. Specifies options for custom content to be printed on the labels.",
            }
        ]
    }
]
const defaultDataTypesForServices = [
    "GLS_SHIPMENT",
    "GLS_PRINTING_OPTIONS",
    "GLS_RETURN_OPTIONS",
    "GLS_CUSTOM_CONTENT",
    "GLS_CREATE_PARCELS_RESPONSE"
]

sdk.registerFunctionDefinitions(
    {
        definition: {
            runtimeName: "createAddress",
            signature: "Name1: string, CountryCode: string, City: string, Street: string, ZIPCode: string, Name2?: string, Name3?: string, Province?: string, StreetNumber?: string, ContactPerson?: string, FixedLinePhonenumber?: string, MobilePhonenumber?: string, Email?: string): GLS_ADDRESS",
            name: [
                {
                    code: "en-US",
                    content: "Create address",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS address object which can be used for shipments.",
                }
            ],
            parameters: [
                {
                    runtimeName: "Name1",
                    name: [
                        {
                            code: "en-US",
                            content: "Name 1",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The name of the recipient or company. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "CountryCode",
                    name: [
                        {
                            code: "en-US",
                            content: "Country code",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The ISO alpha-2 country code. For example, DE for Germany or FR for France.",
                        }
                    ]
                },
                {
                    runtimeName: "City",
                    name: [
                        {
                            code: "en-US",
                            content: "City",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The city of the address. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "Street",
                    name: [
                        {
                            code: "en-US",
                            content: "Street",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The street name of the address. Min length is 4 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "ZIPCode",
                    name: [
                        {
                            code: "en-US",
                            content: "ZIP code",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The ZIP code of the address. Max length is 10 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "Name2",
                    name: [
                        {
                            code: "en-US",
                            content: "Name 2",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Additional name information. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "Name3",
                    name: [
                        {
                            code: "en-US",
                            content: "Name 3",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Additional name information. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "Province",
                    name: [
                        {
                            code: "en-US",
                            content: "Province/State",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The province or state of the address. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "StreetNumber",
                    name: [
                        {
                            code: "en-US",
                            content: "Street number",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The street number of the address. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "ContactPerson",
                    name: [
                        {
                            code: "en-US",
                            content: "Contact person",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The contact person for the address. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "FixedLinePhonenumber",
                    name: [
                        {
                            code: "en-US",
                            content: "Fixed line phone number",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The fixed line phone number for the address. Max length is 35 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "MobilePhonenumber",
                    name: [
                        {
                            code: "en-US",
                            content: "Mobile phone number",
                        },
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The mobile phone number for the address. Max length is 35 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "Email",
                    name: [
                        {
                            code: "en-US",
                            content: "Email",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The email address for the address. Max length is 80 characters.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_ADDRESS",
            ]
        },
        handler: (
            Name1: string,
            CountryCode: string,
            City: string,
            Street: string,
            ZIPCode: string,
            Name2?: string,
            Name3?: string,
            Province?: string,
            StreetNumber?: string,
            ContactPerson?: string,
            FixedLinePhonenumber?: string,
            MobilePhonenumber?: string,
            Email?: string
        ): Address => {
            return {
                Name1,
                Name2,
                Name3,
                CountryCode,
                Province,
                City,
                Street,
                StreetNumber,
                ContactPerson,
                FixedLinePhonenumber,
                MobilePhonenumber,
                eMail: Email,
                ZIPCode
            }
        }
    },
    {
        definition: {
            runtimeName: "createConsignee",
            name: [
                {
                    code: "en-US",
                    content: "Create consignee",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS consignee object which can be used for shipments.",
                }
            ],
            signature: "(consigneeId: string, costCenter: string, Address: GLS_ADDRESS, Category: \"BUSINESS\"|\"PRIVATE\"): GLS_CONSIGNEE",
            parameters: [
                {
                    runtimeName: "consigneeId",
                    name: [
                        {
                            code: "en-US",
                            content: "Consignee ID",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The ID of the consignee. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "costCenter",
                    name: [
                        {
                            code: "en-US",
                            content: "Cost center",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The cost center for the consignee. Max length is 80 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "Address",
                    name: [
                        {
                            code: "en-US",
                            content: "Address",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The address of the consignee.",
                        }
                    ]

                },
                {
                    runtimeName: "Category",
                    name: [
                        {
                            code: "en-US",
                            content: "Category",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The category of the consignee. Can be either BUSINESS or PRIVATE.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_CONSIGNEE",
                "GLS_ADDRESS"
            ]
        },
        handler: (consigneeId: string, costCenter: string, Address: Address, Category: "BUSINESS" | "PRIVATE"): Consignee => {
            return {
                Address,
                Category,
                ConsigneeID: consigneeId,
                CostCenter: costCenter
            }
        }
    },
    {
        definition: {
            runtimeName: "createShipmentUnit",
            signature: "(weight: number, shipmentUnitReference?: string, partnerParcelNumber?: string, note1?: string, note2?: string, shipmentUnitService: GLS_SHIPMENT_UNIT_SERVICE): GLS_SHIPMENT_UNIT",
            name: [
                {
                    code: "en-US",
                    content: "Create shipment unit",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS shipment unit object which can be used for shipments.",
                }
            ],
            parameters: [
                {
                    runtimeName: "weight",
                    name: [
                        {
                            code: "en-US",
                            content: "Weight (kg)",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The weight of the shipment unit in kilograms. Must be a positive number and greater than 0.10 and less than 99.",
                        }
                    ]
                },
                {
                    runtimeName: "shipmentUnitReference",
                    name: [
                        {
                            code: "en-US",
                            content: "Shipment unit reference",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The reference for the shipment unit. Max length is 40 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "partnerParcelNumber",
                    name: [
                        {
                            code: "en-US",
                            content: "Partner parcel number",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The partner parcel number for the shipment unit. Max length is 50 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "note1",
                    name: [
                        {
                            code: "en-US",
                            content: "Note 1",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Note 1 for the shipment unit. Max length is 50 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "note2",
                    name: [
                        {
                            code: "en-US",
                            content: "Note 2",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Note 2 for the shipment unit. Max length is 50 characters.",
                        }
                    ]
                },
                {
                    runtimeName: "shipmentUnitService",
                    name: [
                        {
                            code: "en-US",
                            content: "Shipment unit service",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The service associated with the shipment unit.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_SHIPMENT_UNIT",
            ]
        },
        handler: (weight: number, shipmentUnitReference: string, partnerParcelNumber?: string, note1?: string, note2?: string, shipmentUnitService?: UnitService): ShipmentUnit => {
            return {
                ShipmentUnitReference: shipmentUnitReference,
                Weight: weight,
                PartnerParcelNumber: partnerParcelNumber,
                Note1: note1,
                Note2: note2,
                Service: shipmentUnitService
            }
        }
    },
    {
        definition: {
            runtimeName: "createPrintingOptions",
            signature: "(returnLabels: RETURN_LABELS): GLS_PRINTING_OPTIONS",
            name: [
                {
                    code: "en-US",
                    content: "Create printing options",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS printing options object which can be used when creating shipments.",
                }
            ],
            parameters: [
                {
                    runtimeName: "returnLabels",
                    name: [
                        {
                            code: "en-US",
                            content: "Return labels",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The return labels to be included in the shipment.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_PRINTING_OPTIONS",
                "RETURN_LABELS"
            ]
        },
        handler: (returnLabels: ReturnLabels): PrintingOptions => {
            return {
                ReturnLabels: returnLabels
            }
        }
    },
    {
        definition: {
            runtimeName: "createCustomContent",
            signature: "(barcodeContentType: \"TRACK_ID\"|\"GLS_SHIPMENT_REFERENCE\", customerLogo: string, hideShipperAddress?: boolean, barcodeType?: \"EAN_128\"|\"CODE_39\", barcode?: string): GLS_CUSTOM_CONTENT",
            name: [
                {
                    code: "en-US",
                    content: "Create custom content",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS custom content object for shipment labels.",
                }
            ],
            parameters: [
                {
                    runtimeName: "barcodeContentType",
                    name: [
                        {code: "en-US", content: "Barcode content type"}
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Type of content encoded in the barcode (TRACK_ID or GLS_SHIPMENT_REFERENCE)."
                        }
                    ]
                },
                {
                    runtimeName: "customerLogo",
                    name: [
                        {code: "en-US", content: "Customer logo"}
                    ],
                    description: [
                        {code: "en-US", content: "Base64-encoded customer logo to print on the label."}
                    ]
                },
                {
                    runtimeName: "hideShipperAddress",
                    name: [
                        {code: "en-US", content: "Hide shipper address"}
                    ],
                    description: [
                        {code: "en-US", content: "Whether to hide the shipper address on the label."}
                    ]
                },
                {
                    runtimeName: "barcodeType",
                    name: [
                        {code: "en-US", content: "Barcode type"}
                    ],
                    description: [
                        {code: "en-US", content: "Type of barcode to use (EAN_128 or CODE_39)."}
                    ]
                },
                {
                    runtimeName: "barcode",
                    name: [
                        {code: "en-US", content: "Barcode"}
                    ],
                    description: [
                        {code: "en-US", content: "Barcode value to print on the label."}
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_CUSTOM_CONTENT",
            ]
        },
        handler: (barcodeContentType: CustomContent["BarcodeContentType"], customerLogo: string, hideShipperAddress?: boolean, barcodeType?: CustomContent["BarcodeType"], barcode?: string): CustomContent => {
            return {
                Barcode: barcode,
                BarcodeContentType: barcodeContentType,
                BarcodeType: barcodeType,
                CustomerLogo: customerLogo,
                HideShipperAddress: hideShipperAddress,
            }
        }
    },
    {
        definition: {
            runtimeName: "createShopDeliveryShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create shop delivery shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS shop delivery shipment.",
                }
            ],
            signature: `(parcelShopId: string, ${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                {
                    runtimeName: "parcelShopId",
                    name: [
                        {
                            code: "en-US",
                            content: "Parcel shop Id",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The ID of the parcel shop where the shipment should be delivered.",
                        }
                    ]
                },
                ...defaultParametersForServices
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices
            ]
        },
        handler: async (context: HerculesFunctionContext, parcelShopId: string, shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                ShopDelivery: {
                    ParcelShopID: parcelShopId
                }
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createShopReturnShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create shop return shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS shop return shipment.",
                }
            ],
            signature: `(numberOfLabels: number, ${defaultSignatureForServices}, returnQR: "PDF" | "PNG" | "ZPL"): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                {
                    runtimeName: "parcelShopId",
                    name: [
                        {
                            code: "en-US",
                            content: "Parcel shop Id",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The ID of the parcel shop where the shipment should be delivered.",
                        }
                    ]
                },
                ...defaultParametersForServices,
                {
                    runtimeName: "returnQR",
                    name: [
                        {
                            code: "en-US",
                            content: "Return QR",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The return QR of the shipment.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices
            ]
        },
        handler: async (context: HerculesFunctionContext, numberOfLabels: number, shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions, returnQR?: "PDF" | "PNG" | "ZPL"): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                ShopReturn: {
                    NumberOfLabels: numberOfLabels,
                    ReturnQR: returnQR
                }
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createExchangeShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create exchange shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS exchange shipment.",
                }
            ],
            signature: `(address: GLS_ADDRESS, ${defaultSignatureForServices}, expectedWeight?: number): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                {
                    runtimeName: "address",
                    name: [
                        {
                            code: "en-US",
                            content: "Address",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The address of the exchange shipment.",
                        }
                    ]
                },
                ...defaultParametersForServices,
                {
                    runtimeName: "expectedWeight",
                    name: [
                        {
                            code: "en-US",
                            content: "Expected weight",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The expected weight for the exchange shipment.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
                "GLS_ADDRESS"
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        address: Address,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
                        expectedWeight?: number): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                Exchange: {
                    Address: address,
                    ExpectedWeight: expectedWeight
                }
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createDeliveryAtWorkShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create delivery at work shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS delivery at work shipment.",
                }
            ],
            signature: `(recipientName: string, building: string, floor: number, ${defaultSignatureForServices}, alternateRecipientName?: string, room?: number, phonenumber?: string): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                {
                    runtimeName: "recipientName",
                    name: [
                        {
                            code: "en-US",
                            content: "Recipient name",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The recipient name for the delivery at work shipment.",
                        }
                    ]
                },
                {
                    runtimeName: "building",
                    name: [
                        {
                            code: "en-US",
                            content: "Building",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The building of the delivery at work shipment.",
                        }
                    ]
                },
                {
                    runtimeName: "floor",
                    name: [
                        {
                            code: "en-US",
                            content: "Floor",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The floor of the delivery at work shipment.",
                        }
                    ]
                },
                ...defaultParametersForServices,
                {
                    runtimeName: "alternateRecipientName",
                    name: [
                        {
                            code: "en-US",
                            content: "Alternate recipient name",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The alternate recipient name for the delivery at work shipment.",
                        }
                    ]
                },
                {
                    runtimeName: "room",
                    name: [
                        {
                            code: "en-US",
                            content: "Room",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The room of the delivery at work shipment.",
                        }
                    ]
                },
                {
                    runtimeName: "phonenumber",
                    name: [
                        {
                            code: "en-US",
                            content: "Phone number",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The phone number for the delivery at work shipment.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        recipientName: string, building: string, floor: number,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
                        alternateRecipientName?: string, room?: number, phonenumber?: string): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                DeliveryAtWork: {
                    RecipientName: recipientName,
                    Building: building,
                    Floor: floor,
                    AlternateRecipientName: alternateRecipientName,
                    Room: room,
                    Phonenumber: phonenumber,
                }
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createDepositShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create deposit shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS deposit shipment.",
                }
            ],
            signature: `(placeOfDeposit: string, ${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                {
                    runtimeName: "placeOfDeposit",
                    name: [
                        {
                            code: "en-US",
                            content: "Place of deposit",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The place of deposit for the delivery.",
                        }
                    ]
                },
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler:
            async (context: HerculesFunctionContext,
                   placeOfDeposit: string,
                   shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions): Promise<CreateParcelsResponse> => {
                return postShipmentHelper(context, [{
                    Deposit: {
                        PlaceOfDeposit: placeOfDeposit
                    }
                }], shipment, printingOptions, customContent, returnOptions)
            }
    },
    {
        definition: {
            runtimeName: "createIdentShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create ident shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS ident shipment.",
                }
            ],
            signature: `(birthDate: string, firstName: string, lastName: string, nationality: string, ${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                {
                    runtimeName: "birthDate",
                    name: [
                        {
                            code: "en-US",
                            content: "Birth date",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The birth date for the ident shipment identification.",
                        }
                    ]
                },
                {
                    runtimeName: "firstName",
                    name: [
                        {
                            code: "en-US",
                            content: "First name",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The first name for the ident shipment identification.",
                        }
                    ]
                },
                {
                    runtimeName: "lastName",
                    name: [
                        {
                            code: "en-US",
                            content: "Last name",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The last name for the ident shipment identification.",
                        }
                    ]
                },
                {
                    runtimeName: "nationality",
                    name: [
                        {
                            code: "en-US",
                            content: "Nationality",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The nationality for the ident shipment identification.",
                        }
                    ]
                },
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler:
            async (context: HerculesFunctionContext,
                   birthDate: string, firstName: string, lastName: string, nationality: string,
                   shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
            ): Promise<CreateParcelsResponse> => {
                return postShipmentHelper(context, [{
                    Ident: {
                        Birthdate: birthDate,
                        Firstname: firstName,
                        Lastname: lastName,
                        Nationality: nationality
                    }
                }], shipment, printingOptions, customContent, returnOptions)
            }
    },
    {
        definition: {
            runtimeName: "createIdentPinShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create ident pin shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS ident pin shipment.",
                }
            ],
            signature: `(pin: string, ${defaultSignatureForServices}, birthDate: string): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                {
                    runtimeName: "pin",
                    name: [
                        {
                            code: "en-US",
                            content: "Pin",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The pin for the ident pin shipment identification.",
                        }
                    ]
                },
                ...defaultParametersForServices,
                {
                    runtimeName: "birthDate",
                    name: [
                        {
                            code: "en-US",
                            content: "Birth date",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The birth date for the ident pin shipment identification.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        pin: string,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
                        birthDate?: string
        ): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                IdentPin: {
                    PIN: pin,
                    Birthdate: birthDate,
                }
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createPickAndShipShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create pick and ship shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS pick and ship shipment.",
                }
            ],
            signature: `(pickupDate: string, ${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                {
                    runtimeName: "pickupDate",
                    name: [
                        {
                            code: "en-US",
                            content: "Pickup date",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The pickup date for the pick and ship shipment.",
                        }
                    ]
                },
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        pickupDate: string,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
        ): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                PickAndShip: {
                    PickupDate: pickupDate
                }
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createFlexDeliveryShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create flex delivery shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS flex delivery shipment.",
                }
            ],
            signature: `(${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
        ): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                FlexDeliveryService: {}
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createSignatureShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create signature shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS signature shipment.",
                }
            ],
            signature: `(${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
        ): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                SignatureService: {}
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createGuaranteed24Shipment",
            name: [
                {
                    code: "en-US",
                    content: "Create guaranteed 24 shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS guaranteed 24 shipment.",
                }
            ],
            signature: `(${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
        ): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                Guaranteed24Service: {}
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createAddresseeOnlyShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create addressee only shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS addressee only shipment.",
                }
            ],
            signature: `(${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
        ): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                AddresseeOnlyService: {}
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createTyreShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create tyre shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS tyre shipment.",
                }
            ],
            signature: `(${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
        ): Promise<CreateParcelsResponse> => {
            return postShipmentHelper(context, [{
                TyreService: {}
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createDeliveryNextWorkingDayShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create delivery next working day shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS delivery next working day shipment.",
                }
            ],
            signature: `(${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
        ): Promise<CreateParcelsResponse> => {
            if (shipment.Product != "EXPRESS") {
                throw new RuntimeErrorException("INVALID_PRODUCT", "The product for Delivery Next Working Day service must be EXPRESS.")
            }
            return postShipmentHelper(context, [{
                EOB: {}
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "createDeliverySaturdayShipment",
            name: [
                {
                    code: "en-US",
                    content: "Create delivery Saturday shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Creates a GLS delivery Saturday shipment.",
                }
            ],
            signature: `(${defaultSignatureForServices}): GLS_CREATE_PARCELS_RESPONSE`,
            parameters: [
                ...defaultParametersForServices,
            ],
            linkedDataTypes: [
                ...defaultDataTypesForServices,
            ]
        },
        handler: async (context: HerculesFunctionContext,
                        shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
        ): Promise<CreateParcelsResponse> => {
            if (shipment.Product != "EXPRESS") {
                throw new RuntimeErrorException("INVALID_PRODUCT", "The product for Delivery Friday service must be EXPRESS.")
            }
            return postShipmentHelper(context, [{
                SaturdayService: {}
            }], shipment, printingOptions, customContent, returnOptions)
        }
    },
    {
        definition: {
            runtimeName: "validateShipment",
            name: [
                {
                    code: "en-US",
                    content: "Validate shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Validates a GLS shipment.",
                }
            ],
            signature: "(data: GLS_VALIDATE_SHIPMENT_REQUEST_DATA): GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
            parameters: [
                {
                    runtimeName: "data",
                    name: [
                        {
                            code: "en-US",
                            content: "Data",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The shipment data to validate.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
                "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
            ],
        },
        handler: async (data: ValidateShipmentRequestData, context: HerculesFunctionContext): Promise<ValidateShipmentResponseData> => {
            try {
                return await validateShipment(data, context)
            } catch (error) {
                if (typeof error === "string") {
                    throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
                }
                throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
            }
        }
    },
    {
        definition: {
            runtimeName: "cancelShipment",
            name: [
                {
                    code: "en-US",
                    content: "Cancel shipment",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Cancels a GLS shipment.",
                }
            ],
            signature: "(data: GLS_CANCEL_SHIPMENT_REQUEST_DATA): GLS_CANCEL_SHIPMENT_RESPONSE_DATA",
            parameters: [
                {
                    runtimeName: "data",
                    name: [
                        {
                            code: "en-US",
                            content: "Data",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The cancel shipment request data.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
                "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
            ],
        },
        handler: async (data: CancelShipmentRequestData, context: HerculesFunctionContext): Promise<CancelShipmentResponseData> => {
            try {
                return await cancelShipment(data, context)
            } catch (error) {
                if (typeof error === "string") {
                    throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
                }
                throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
            }
        }
    },
    {
        definition: {
            runtimeName: "getAllowedServices",
            name: [
                {
                    code: "en-US",
                    content: "Get allowed services",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Returns the allowed GLS services for a given set of parameters.",
                }
            ],
            signature: "(data: GLS_ALLOWED_SERVICES_REQUEST_DATA): GLS_ALLOWED_SERVICES_RESPONSE_DATA",
            parameters: [
                {
                    runtimeName: "data",
                    name: [
                        {
                            code: "en-US",
                            content: "Data",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The allowed services request data.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_ALLOWED_SERVICES_REQUEST_DATA",
                "GLS_ALLOWED_SERVICES_RESPONSE_DATA",
            ],
        },
        handler: async (data: AllowedServicesRequestData, context: HerculesFunctionContext): Promise<AllowedServicesResponseData> => {
            try {
                return await getAllowedServices(data, context)
            } catch (error) {
                if (typeof error === "string") {
                    throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
                }
                throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
            }
        }
    },
    {
        definition: {
            runtimeName: "getEndOfDayReport",
            name: [
                {
                    code: "en-US",
                    content: "Get end of day report",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Returns the GLS end of day report.",
                }
            ],
            signature: "(data: GLS_END_OF_DAY_REQUEST_DATA): GLS_END_OF_DAY_RESPONSE_DATA",
            parameters: [
                {
                    runtimeName: "data",
                    name: [
                        {
                            code: "en-US",
                            content: "Data",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The end of day report request data.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_END_OF_DAY_REQUEST_DATA",
                "GLS_END_OF_DAY_RESPONSE_DATA",
            ],
        },
        handler: async (data: EndOfDayRequestData, context: HerculesFunctionContext): Promise<EndOfDayResponseData> => {
            try {
                return await getEndOfDayInfo(data, context)
            } catch (error) {
                if (typeof error === "string") {
                    throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
                }
                throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
            }
        }
    },
    {
        definition: {
            runtimeName: "updateParcelWeight",
            name: [
                {
                    code: "en-US",
                    content: "Update parcel weight",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Updates the weight of a GLS parcel.",
                }
            ],
            signature: "(data: GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA): GLS_END_OF_DAY_RESPONSE_DATA",
            parameters: [
                {
                    runtimeName: "data",
                    name: [
                        {
                            code: "en-US",
                            content: "Data",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The update parcel weight request data.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA",
                "GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA",
            ],
        },
        handler: async (data: UpdateParcelWeightRequestData, context: HerculesFunctionContext): Promise<UpdateParcelWeightResponseData> => {
            try {
                return await updateParcelWeight(data, context)
            } catch (error) {
                if (typeof error === "string") {
                    throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
                }
                throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
            }
        }
    },
    {
        definition: {
            runtimeName: "reprintParcel",
            name: [
                {
                    code: "en-US",
                    content: "Reprint parcel",
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "Reprints the labels for a GLS parcel.",
                }
            ],
            signature: "(data: GLS_REPRINT_PARCEL_REQUEST_DATA): GLS_REPRINT_PARCEL_RESPONSE_DATA",
            parameters: [
                {
                    runtimeName: "data",
                    name: [
                        {
                            code: "en-US",
                            content: "Data",
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The reprint parcel request data.",
                        }
                    ]
                }
            ],
            linkedDataTypes: [
                "GLS_REPRINT_PARCEL_REQUEST_DATA",
                "GLS_REPRINT_PARCEL_RESPONSE_DATA",
            ],
        },
        handler: async (data: ReprintParcelRequestData, context: HerculesFunctionContext): Promise<ReprintParcelResponseData> => {
            try {
                return await reprintParcel(data, context)
            } catch (error) {
                if (typeof error === "string") {
                    throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
                }
                throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
            }
        }
    }
)

sdk.registerDataTypes(
    {
        identifier: "GLS_ADDRESS",
        type: types.get("GLS_ADDRESS")!!,
        name: [
            {
                code: "en-US",
                content: "Address"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Address"
            }
        ]
    },
    {
        identifier: "GLS_CONSIGNEE",
        type: types.get("GLS_CONSIGNEE")!!,
        name: [
            {
                code: "en-US",
                content: "Consignee"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Consignee"
            }
        ],
        linkedDataTypes: [
            "GLS_ADDRESS"
        ]
    },
    {
        identifier: "GLS_UNIT_SERVICE",
        type: types.get("GLS_UNIT_SERVICE")!!,
        name: [
            {
                code: "en-US",
                content: "Unit Service"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Unit Service"
            }
        ]
    },
    {
        identifier: "GLS_SHIPMENT_UNIT",
        type: types.get("GLS_SHIPMENT_UNIT")!!,
        name: [
            {
                code: "en-US",
                content: "Shipment Unit"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Shipment Unit"
            }
        ],
        linkedDataTypes: [
            "GLS_UNIT_SERVICE",
        ]
    },
    {
        identifier: "GLS_SHIPPER",
        type: types.get("GLS_SHIPPER")!!,
        name: [
            {
                code: "en-US",
                content: "Shipper"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Shipper"
            }
        ],
        linkedDataTypes: [
            "GLS_ADDRESS"
        ]
    },
    {
        identifier: "GLS_SHIPMENT_SERVICE",
        type: types.get("GLS_SHIPMENT_SERVICE")!!,
        name: [
            {
                code: "en-US",
                content: "Shipment Service"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Shipment Service"
            }
        ]
    },
    {
        identifier: "GLS_SHIPMENT",
        type: types.get("GLS_SHIPMENT")!!,
        name: [
            {
                code: "en-US",
                content: "Shipment"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Shipment"
            }
        ],
        linkedDataTypes: [
            "GLS_SHIPMENT_SERVICE",
            "GLS_ADDRESS",
            "GLS_SHIPMENT_UNIT",
            "GLS_CONSIGNEE",
            "GLS_SHIPPER"
        ]
    },
    {
        identifier: "GLS_PRINTING_OPTIONS",
        type: types.get("GLS_PRINTING_OPTIONS")!!,
        name: [
            {
                code: "en-US",
                content: "Printing Options"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Printing Options"
            }
        ]
    },
    {
        identifier: "GLS_RETURN_OPTIONS",
        type: types.get("GLS_RETURN_OPTIONS")!!,
        name: [
            {
                code: "en-US",
                content: "Return Options"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Return Options"
            }
        ]
    },
    {
        identifier: "GLS_CUSTOM_CONTENT",
        type: types.get("GLS_CUSTOM_CONTENT")!!,
        name: [
            {
                code: "en-US",
                content: "Custom content"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Custom content"
            }
        ]
    },
    {
        identifier: "GLS_SHIPMENT_WITHOUT_SERVICES",
        type: types.get("GLS_SHIPMENT_WITHOUT_SERVICES")!!,
        name: [
            {
                code: "en-US",
                content: "Shipment without services"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Shipment without services"
            }
        ],
        linkedDataTypes: [
            "GLS_SHIPMENT",
            "GLS_PRINTING_OPTIONS",
            "GLS_RETURN_OPTIONS",
            "GLS_CUSTOM_CONTENT"
        ]
    },
    {
        identifier: "GLS_CREATE_PARCELS_RESPONSE",
        type: types.get("GLS_CREATE_PARCELS_RESPONSE")!!,
        name: [
            {
                code: "en-US",
                content: "Create parcels response"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Create parcels response"
            }
        ]
    },
    {
        identifier: "GLS_CANCEL_SHIPMENT_REQUEST_DATA",
        type: types.get("GLS_CANCEL_SHIPMENT_REQUEST_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Cancel shipment request data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Cancel shipment request data"
            }
        ]
    },
    {
        identifier: "GLS_CANCEL_SHIPMENT_RESPONSE_DATA",
        type: types.get("GLS_CANCEL_SHIPMENT_RESPONSE_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Cancel shipment response data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Cancel shipment response data"
            }
        ]
    },
    {
        identifier: "GLS_ALLOWED_SERVICES_REQUEST_DATA",
        type: types.get("GLS_ALLOWED_SERVICES_REQUEST_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Allowed services request data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Allowed services request data"
            }
        ]
    },
    {
        identifier: "GLS_ALLOWED_SERVICES_RESPONSE_DATA",
        type: types.get("GLS_ALLOWED_SERVICES_RESPONSE_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Allowed services response data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Allowed services response data"
            }
        ]
    },
    {
        identifier: "GLS_END_OF_DAY_REQUEST_DATA",
        type: types.get("GLS_END_OF_DAY_REQUEST_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "End of day request data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "End of day request data"
            }
        ]
    },
    {
        identifier: "GLS_END_OF_DAY_RESPONSE_DATA",
        type: types.get("GLS_END_OF_DAY_RESPONSE_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "End of day response data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "End of day response data"
            }
        ]
    },
    {
        identifier: "GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA",
        type: types.get("GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Update parcel weight request data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Update parcel weight request data"
            }
        ]
    },
    {
        identifier: "GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA",
        type: types.get("GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Update parcel weight response data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Update parcel weight response data"
            }
        ]
    },
    {
        identifier: "GLS_REPRINT_PARCEL_REQUEST_DATA",
        type: types.get("GLS_REPRINT_PARCEL_REQUEST_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Reprint parcel request data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Reprint parcel request data"
            }
        ]
    },
    {
        identifier: "GLS_REPRINT_PARCEL_RESPONSE_DATA",
        type: types.get("GLS_REPRINT_PARCEL_RESPONSE_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Reprint parcel response data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Reprint parcel response data"
            }
        ]
    },
    {
        identifier: "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
        type: types.get("GLS_VALIDATE_SHIPMENT_REQUEST_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Validate shipment request data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Validate shipment request data"
            }
        ]
    },
    {
        identifier: "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
        type: types.get("GLS_VALIDATE_SHIPMENT_RESPONSE_DATA")!!,
        name: [
            {
                code: "en-US",
                content: "Validate shipment response data"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "Validate shipment response data"
            }
        ]
    },
    {
        identifier: "GLS_UNIT_SERVICE",
        type: types.get("GLS_UNIT_SERVICE")!!,
        name: [
            {
                code: "en-US",
                content: "GLS unit service"
            }
        ],
        displayMessage: [
            {
                code: "en-US",
                content: "GLS unit service"
            }
        ]
    }
)


sdk.registerConfigDefinitions(
    {
        identifier: "contact_id",
        type: "STRING",
        name: [
            {
                code: "en-US",
                content: "Contact ID"
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The contact id identifying the GLS account to use for the API requests. This contact must be linked to a GLS contract with API access."
            }
        ],
        defaultValue: "",
        linkedDataTypes: ["STRING"],
    },
    {
        identifier: "client_id",
        type: "STRING",
        name: [
            {
                code: "en-US",
                content: "Client ID"
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The client id to authenticate with the GLS API"
            }
        ],
        linkedDataTypes: ["STRING"],
    },
    {
        identifier: "client_secret",
        type: "STRING",
        name: [
            {
                code: "en-US",
                content: "Client secret"
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The client secret to authenticate with the GLS API"
            }
        ],
        linkedDataTypes: ["STRING"],
    },
    {
        identifier: "ship_it_api_url",
        type: "STRING",
        defaultValue: " https://api.gls-group.net/shipit-farm/v1/backend/rs",
        name: [
            {
                code: "en-US",
                content: "The ShipIt API url"
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The url of the GLS ShipIt API."
            }
        ],
        linkedDataTypes: ["STRING"],
    },
    {
        identifier: "auth_url",
        type: "STRING",
        defaultValue: "https://api.gls-group.net/oauth2/v2/token",
        name: [
            {
                code: "en-US",
                content: "The Auth API url"
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The url of the Auth api ending in /token."
            }
        ],
        linkedDataTypes: ["STRING"],
    },
    {
        identifier: "shipper",
        type: "GLS_SHIPPER",
        name: [
            {
                code: "en-US",
                content: "Shipper"
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The shipper information to use for the shipments. This will be used if the shipper information is not provided in the shipment data."
            }
        ],
        linkedDataTypes: ["GLS_SHIPPER"]
    }
).catch(reason => {
    console.error("Failed to register config definitions:", reason)
    process.exit(1)
})

connectToSdk();

function connectToSdk() {
    sdk.connect().then((_: HerculesActionProjectConfiguration[]) => {
        console.log("SDK connected successfully");
    }).catch((_error) => {
        console.error("Error connecting SDK:");
    })

    sdk.onError((error) => {
        console.error("SDK Error occurred:", error.message);
        console.log("Attempting to reconnect in 5s...");
        setTimeout(() => {
            connectToSdk();
        }, 5000)
    })
}
