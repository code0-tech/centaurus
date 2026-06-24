import {
    Description,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { cancelShipment } from "../helpers.js";
import {
    CancelShipmentRequestData,
    CancelShipmentResponseData,
} from "../data_types/glsCancelShipment.js";

@Identifier("cancelShipment")
@Signature("(data: GLS_CANCEL_SHIPMENT_REQUEST_DATA): GLS_CANCEL_SHIPMENT_RESPONSE_DATA")
@Name({ code: "en-US", content: "Cancel shipment" })
@DisplayMessage({ code: "en-US", content: "Cancel shipment" })
@Documentation({
    code: "en-US",
    content: "Cancels an existing shipment by its Track ID. Only possible if the parcel has not yet been scanned.",
})
@Description({
    code: "en-US",
    content: "Cancels an existing shipment by its Track ID. Only possible if the parcel has not yet been scanned.",
})
@Parameter({
    runtimeName: "data",
    name: [{ code: "en-US", content: "Data" }],
    description: [{ code: "en-US", content: "The cancel shipment request data." }],
})
export class CancelShipmentFunction {
    async run(context: FunctionContext, data: CancelShipmentRequestData): Promise<CancelShipmentResponseData> {
        try {
            return await cancelShipment(data, context);
        } catch (error) {
            if (typeof error === "string") {
                throw new RuntimeError("ERROR_CREATING_GLS_SHIPMENT", error);
            }
            throw new RuntimeError("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.");
        }
    }
}
