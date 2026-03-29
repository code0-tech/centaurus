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
                signature: `(birthDate: string, firstName: string, lastName: string, nationality: string, ${DEFAULT_SIGNATURE_FOR_SERVICES}): GLS_CREATE_PARCELS_RESPONSE`,
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
                    ...DEFAULT_PARAMETERS_FOR_SERVICES,
                ],
                linkedDataTypes: [
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES,
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
    )
}