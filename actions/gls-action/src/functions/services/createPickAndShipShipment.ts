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
                runtimeName: "createPickAndShipShipment",
                documentation: [
                    {
                        code: "en-US",
                        content: "Schedules a pickup from the consignee's address on a given date."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create pick and ship shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Create pick and ship shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Schedules a pickup from the consignee's address on a given date.",
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