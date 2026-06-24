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
    ReprintParcelRequestData,
    ReprintParcelResponseData,
    ReprintParcelResponseDataSchema,
} from "../data_types/glsReprintParcel.js";

@Identifier("reprintParcel")
@Signature("(data: GLS_REPRINT_PARCEL_REQUEST_DATA): GLS_REPRINT_PARCEL_RESPONSE_DATA")
@Name({ code: "en-US", content: "Reprint parcel" })
@DisplayMessage({ code: "en-US", content: "Reprint parcel" })
@Documentation({
    code: "en-US",
    content: "Reprints the label for an existing parcel.\nUse this if the original label is damaged, lost, or needs to be printed in a different format.",
})
@Description({
    code: "en-US",
    content: "Reprints the label for an existing parcel.\nUse this if the original label is damaged, lost, or needs to be printed in a different format.",
})
@Parameter({
    runtimeName: "data",
    name: [{ code: "en-US", content: "Data" }],
    description: [{ code: "en-US", content: "The reprint parcel request data." }],
})
export class ReprintParcelFunction {
    async run(context: FunctionContext, data: ReprintParcelRequestData): Promise<ReprintParcelResponseData> {
        const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

        try {
            const result = await axios.post(`${url}/rs/shipments/reprintparcel`, data, {
                headers: {
                    Authorization: `Bearer ${await getAuthToken(context)}`,
                    "Content-Type": "application/glsVersion1+json",
                },
            });
            return ReprintParcelResponseDataSchema.parse(result.data);
        } catch (error: any) {
            console.log(error);
            throw new RuntimeError("REPRINT_PARCEL_FAILED", error.toString());
        }
    }
}
