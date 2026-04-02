import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../../types/glsShipment";
import {PrintingOptions} from "../../types/glsPrintingOptions";
import {CustomContent} from "../../types/glsCustomContent";
import {ReturnOptions} from "../../types/glsReturnOptions";
import {CreateParcelsResponse} from "../../types/glsCreateParcelsResponse";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createDeliveryAtWorkShipment",
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create delivery at work shipment"
                    }
                ],
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
                signature: `(recipientName: string, building: string, floor: number, ${DEFAULT_SIGNATURE_FOR_SERVICES}, alternateRecipientName?: string, room?: number, phonenumber?: string): GLS_CREATE_PARCELS_RESPONSE`,
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
                    ...DEFAULT_PARAMETERS_FOR_SERVICES,
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
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES,
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
    )
}