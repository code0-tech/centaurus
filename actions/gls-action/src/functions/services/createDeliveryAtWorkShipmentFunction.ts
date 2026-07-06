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

@Identifier("createDeliveryAtWorkShipment")
@Signature(
    `(recipientName: string, building: string, floor: number, ${SHARED_SERVICE_SIGNATURE}, alternateRecipientName?: string, room?: number, phonenumber?: string): GLS_CREATE_PARCELS_RESPONSE`
)
@Name({ code: "en-US", content: "Create delivery at work shipment" })
@DisplayMessage({ code: "en-US", content: "Create delivery at work shipment" })
@Documentation({
    code: "en-US",
    content: "Delivers a parcel to a specific location within a workplace (building, floor, room).",
})
@Description({
    code: "en-US",
    content: "Delivers a parcel to a specific location within a workplace (building, floor, room).",
})
@Parameter({
    runtimeName: "recipientName",
    name: [{ code: "en-US", content: "Recipient name" }],
    description: [{ code: "en-US", content: "The recipient name for the delivery at work shipment." }],
})
@Parameter({
    runtimeName: "building",
    name: [{ code: "en-US", content: "Building" }],
    description: [{ code: "en-US", content: "The building of the delivery at work shipment." }],
})
@Parameter({
    runtimeName: "floor",
    name: [{ code: "en-US", content: "Floor" }],
    description: [{ code: "en-US", content: "The floor of the delivery at work shipment." }],
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
@Parameter({
    runtimeName: "alternateRecipientName",
    name: [{ code: "en-US", content: "Alternate recipient name" }],
    description: [{ code: "en-US", content: "The alternate recipient name for the delivery at work shipment." }],
    optional: true,
})
@Parameter({
    runtimeName: "room",
    name: [{ code: "en-US", content: "Room" }],
    description: [{ code: "en-US", content: "The room of the delivery at work shipment." }],
    optional: true,
})
@Parameter({
    runtimeName: "phonenumber",
    name: [{ code: "en-US", content: "Phone number" }],
    description: [{ code: "en-US", content: "The phone number for the delivery at work shipment." }],
    optional: true,
})
export class CreateDeliveryAtWorkShipmentFunction {
    async run(
        context: FunctionContext,
        recipientName: string,
        building: string,
        floor: number,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions,
        alternateRecipientName?: string,
        room?: number,
        phonenumber?: string
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(
            context,
            [
                {
                    DeliveryAtWork: {
                        RecipientName: recipientName,
                        Building: building,
                        Floor: floor,
                        AlternateRecipientName: alternateRecipientName,
                        Room: room,
                        Phonenumber: phonenumber,
                    },
                },
            ],
            shipment,
            printingOptions,
            customContent,
            returnOptions
        );
    }
}
