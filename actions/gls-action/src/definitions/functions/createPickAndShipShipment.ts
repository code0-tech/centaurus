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
                signature: `(pickupDate: string, ${DEFAULT_SIGNATURE_FOR_SERVICES}): GLS_CREATE_PARCELS_RESPONSE`,
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
                    ...DEFAULT_PARAMETERS_FOR_SERVICES,
                ],
                linkedDataTypes: [
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES,
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
    )
}