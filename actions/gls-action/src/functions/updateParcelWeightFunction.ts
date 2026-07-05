//TODO: Outsource this into seperate functions for trackid, parcelnumber, references, etc.

import axios from "axios";
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
import { getAuthToken } from "../helpers.js";
import {
    UpdateParcelWeightRequestData,
    UpdateParcelWeightResponseData,
    UpdateParcelWeightResponseDataSchema,
} from "../data_types/glsUpdateParcelWeight.js";

@Identifier("updateParcelWeight")
@Signature("(data: GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA): GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA")
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
    runtimeName: "data",
    name: [{ code: "en-US", content: "Data" }],
    description: [{ code: "en-US", content: "The update parcel weight request data." }],
})
export class UpdateParcelWeightFunction {
    async run(context: FunctionContext, data: UpdateParcelWeightRequestData): Promise<UpdateParcelWeightResponseData> {
        const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

        try {
            const result = await axios.post(`${url}/rs/shipments/updateparcelweight`, data, {
                headers: {
                    Authorization: `Bearer ${await getAuthToken(context)}`,
                    "Content-Type": "application/glsVersion1+json",
                },
            });
            return UpdateParcelWeightResponseDataSchema.parse(result.data);
        } catch (error: any) {
            throw new RuntimeError("UPDATE_PARCEL_WEIGHT_FAILED", error.toString());
        }
    }
}
