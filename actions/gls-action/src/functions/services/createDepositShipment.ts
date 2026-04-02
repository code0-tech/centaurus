import {ActionSdk} from "@code0-tech/hercules";
import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../../types/glsShipment";
import {PrintingOptions} from "../../types/glsPrintingOptions";
import {CustomContent} from "../../types/glsCustomContent";
import {ReturnOptions} from "../../types/glsReturnOptions";
import {CreateParcelsResponse} from "../../types/glsCreateParcelsResponse";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createDepositShipment",
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create deposit shipment"
                    }
                ],
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