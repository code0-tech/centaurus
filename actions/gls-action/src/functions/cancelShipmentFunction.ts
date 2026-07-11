import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import {cancelShipment} from "../helpers.js";
import {CancelShipmentResponseData} from "../data_types/glsCancelShipment.js";

@Identifier("cancelShipment")
@DisplayIcon("codezero:gls")
@Signature("(TrackID: string): GLS_CANCEL_SHIPMENT_RESPONSE_DATA")
@Name({code: "en-US", content: "Cancel shipment"})
@DisplayMessage({code: "en-US", content: "Cancel shipment"})
@Documentation({
    code: "en-US",
    content: "Cancels an existing shipment by its Track ID. Only possible if the parcel has not yet been scanned.",
})
@Description({
    code: "en-US",
    content: "Cancels an existing shipment by its Track ID. Only possible if the parcel has not yet been scanned.",
})
@Parameter({
    runtimeName: "TrackID",
    name: [{code: "en-US", content: "Track ID"}],
    description: [{code: "en-US", content: "The Track ID of the shipment to cancel."}],
})
export class CancelShipmentFunction {
    async run(context: FunctionContext, TrackID: string): Promise<CancelShipmentResponseData> {
        try {
            return await cancelShipment({
                TrackID
            }, context);
        } catch (error) {
            if (typeof error === "string") {
                throw new RuntimeError("ERROR_CREATING_GLS_SHIPMENT", error);
            }
            throw new RuntimeError("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while cancelling the GLS shipment.");
        }
    }
}
