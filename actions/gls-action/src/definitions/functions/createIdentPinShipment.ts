import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../datatypes/glsShipment";
import {PrintingOptions} from "../datatypes/glsPrintingOptions";
import {CustomContent} from "../datatypes/glsCustomContent";
import {ReturnOptions} from "../datatypes/glsReturnOptions";
import {CreateParcelsResponse} from "../datatypes/glsCreateParcelsResponse";


export function register(sdk: ActionSdk) {
    return sdk.registerFunctionDefinitions(
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