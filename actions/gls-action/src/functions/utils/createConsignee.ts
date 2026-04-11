import {ActionSdk} from "@code0-tech/hercules";
import {AddressSchema} from "../../types/glsAddress";
import {ConsigneeSchema} from "../../types/glsConsignee";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createConsignee",
                documentation: [
                    {
                        code: "en-US",
                        content: "Creates a GLS consignee (recipient) object for use in shipments."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create consignee"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Create consignee",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS consignee (recipient) object for use in shipments.",
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
            handler: (consigneeId: string, costCenter: string, Address: AddressSchema, Category: "BUSINESS" | "PRIVATE"): ConsigneeSchema => {
                return {
                    Address,
                    Category,
                    ConsigneeID: consigneeId,
                    CostCenter: costCenter
                }
            }
        },
    )
}