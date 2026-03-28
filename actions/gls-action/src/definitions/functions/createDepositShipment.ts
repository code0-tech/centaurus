import {ActionSdk} from "@code0-tech/hercules";
import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../datatypes/glsShipment";
import {PrintingOptions} from "../datatypes/glsPrintingOptions";
import {CustomContent} from "../datatypes/glsCustomContent";
import {ReturnOptions} from "../datatypes/glsReturnOptions";
import {CreateParcelsResponse} from "../datatypes/glsCreateParcelsResponse";

export function register(sdk: ActionSdk) {
    return sdk.registerFunctionDefinitions(
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
                signature: `(placeOfDeposit: string, ${DEFAULT_SIGNATURE_FOR_SERVICES}): GLS_CREATE_PARCELS_RESPONSE`,
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
                    ...DEFAULT_PARAMETERS_FOR_SERVICES,
                ],
                linkedDataTypes: [
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES,
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
    )
}