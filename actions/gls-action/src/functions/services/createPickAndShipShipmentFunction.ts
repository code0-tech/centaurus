import {
    Description,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { postShipmentHelper } from "../../helpers.js";
import { ShipmentWithoutServices } from "../../data_types/glsShipment.js";
import { CreateParcelsResponse } from "../../data_types/glsCreateParcelsResponse.js";
import { PrintingOptions } from "../../data_types/glsPrintingOptions.js";
import { CustomContent } from "../../data_types/glsCustomContent.js";
import { ReturnOptions } from "../../data_types/glsReturnOptions.js";
import {
    SHARED_SERVICE_SIGNATURE,
    SharedCustomContentParameter,
    SharedPrintingOptionsParameter,
    SharedReturnOptionsParameter,
    SharedShipmentParameter,
} from "./_shared.js";

@Identifier("createPickAndShipShipment")
@Signature(`(pickupDate: string, ${SHARED_SERVICE_SIGNATURE}): GLS_CREATE_PARCELS_RESPONSE`)
@Name({ code: "en-US", content: "Create pick and ship shipment" })
@DisplayMessage({ code: "en-US", content: "Create pick and ship shipment" })
@Documentation({
    code: "en-US",
    content: "Schedules a pickup from the consignee's address on a given date.",
})
@Description({
    code: "en-US",
    content: "Schedules a pickup from the consignee's address on a given date.",
})
@Parameter({
    runtimeName: "pickupDate",
    name: [{ code: "en-US", content: "Pickup date" }],
    description: [{ code: "en-US", content: "The pickup date for the pick and ship shipment." }],
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
export class CreatePickAndShipShipmentFunction {
    async run(
        context: FunctionContext,
        pickupDate: string,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(
            context,
            [{ PickAndShip: { PickupDate: pickupDate } }],
            shipment,
            printingOptions,
            customContent,
            returnOptions
        );
    }
}
