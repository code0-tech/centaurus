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
                runtimeName: "createIdentPinShipment",
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create ident pin shipment"
                    }
                ],
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
                signature: `(pin: string, ${DEFAULT_SIGNATURE_FOR_SERVICES}, birthDate: string): GLS_CREATE_PARCELS_RESPONSE`,
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
                    ...DEFAULT_PARAMETERS_FOR_SERVICES,
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
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES,
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
    )
}