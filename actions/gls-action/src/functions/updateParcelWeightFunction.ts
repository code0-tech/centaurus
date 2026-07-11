//TODO: Outsource this into seperate functions for trackid, parcelnumber, references, etc.

import axios from "axios";
import {
    Description, DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { getAuthToken } from "../helpers.js";
import {
    UpdateParcelWeightResponseData,
    UpdateParcelWeightResponseDataSchema,
} from "../data_types/glsUpdateParcelWeight.js";

@Identifier("updateParcelWeight")
@DisplayIcon("codezero:gls")
@Signature("(Weight: number, TrackID?: string, ParcelNumber?: number, ShipmentReference?: string, ShipmentUnitReference?: string, PartnerParcelNumber?: string): GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA")
@Name({ code: "en-US", content: "Update parcel weight" })
@DisplayMessage({ code: "en-US", content: "Update parcel weight" })
@Documentation({
    code: "en-US",
    content: "Updates the weight of an already-created parcel. Useful when the final weight is only known after packaging.",
})
@Description({
    code: "en-US",
    content: "Updates the weight of an already-created parcel. Useful when the final weight is only known after packaging.",
})
@Parameter({
    runtimeName: "Weight",
    name: [{ code: "en-US", content: "Weight" }],
    description: [{ code: "en-US", content: "The new weight of the parcel in kilograms. Minimum is 0.1." }],
})
@Parameter({
    runtimeName: "TrackID",
    name: [{ code: "en-US", content: "Track ID" }],
    description: [{ code: "en-US", content: "The Track ID of the parcel to update. Max length is 8 characters." }],
    optional: true,
})
@Parameter({
    runtimeName: "ParcelNumber",
    name: [{ code: "en-US", content: "Parcel number" }],
    description: [{ code: "en-US", content: "The parcel number of the parcel to update." }],
    optional: true,
})
@Parameter({
    runtimeName: "ShipmentReference",
    name: [{ code: "en-US", content: "Shipment reference" }],
    description: [{ code: "en-US", content: "The shipment reference of the parcel to update. Max length is 40 characters." }],
    optional: true,
})
@Parameter({
    runtimeName: "ShipmentUnitReference",
    name: [{ code: "en-US", content: "Shipment unit reference" }],
    description: [{ code: "en-US", content: "The shipment unit reference of the parcel to update. Max length is 40 characters." }],
    optional: true,
})
@Parameter({
    runtimeName: "PartnerParcelNumber",
    name: [{ code: "en-US", content: "Partner parcel number" }],
    description: [{ code: "en-US", content: "The partner parcel number of the parcel to update. Max length is 50 characters." }],
    optional: true,
})
export class UpdateParcelWeightFunction {
    async run(
        context: FunctionContext,
        Weight: number,
        TrackID?: string,
        ParcelNumber?: number,
        ShipmentReference?: string,
        ShipmentUnitReference?: string,
        PartnerParcelNumber?: string
    ): Promise<UpdateParcelWeightResponseData> {
        const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

        try {
            const result = await axios.post(
                `${url}/rs/shipments/updateparcelweight`,
                {
                    TrackID,
                    ParcelNumber,
                    ShipmentReference,
                    ShipmentUnitReference,
                    PartnerParcelNumber,
                    Weight,
                },
                {
                    headers: {
                        Authorization: `Bearer ${await getAuthToken(context)}`,
                        "Content-Type": "application/glsVersion1+json",
                    },
                }
            );
            return UpdateParcelWeightResponseDataSchema.parse(result.data);
        } catch (error: any) {
            throw new RuntimeError("UPDATE_PARCEL_WEIGHT_FAILED", error.toString());
        }
    }
}
