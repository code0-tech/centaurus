//TODO: Why is the request data here wrapped within a object and isn't a direct parameter

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
    EndOfDayRequestData,
    EndOfDayResponseData,
    EndOfDayResponseDataSchema,
} from "../data_types/glsEndOfDay.js";

@Identifier("getEndOfDayReport")
@Signature("(data: GLS_END_OF_DAY_REQUEST_DATA): GLS_END_OF_DAY_RESPONSE_DATA")
@Name({ code: "en-US", content: "Get end of day report" })
@DisplayMessage({ code: "en-US", content: "Get end of day report" })
@Documentation({
    code: "en-US",
    content: "Retrieves all shipments dispatched on a given date. Useful for reconciliation and end-of-day processing.",
})
@Description({
    code: "en-US",
    content: "Retrieves all shipments dispatched on a given date. Useful for reconciliation and end-of-day processing.",
})
@Parameter({
    runtimeName: "data",
    name: [{ code: "en-US", content: "Data" }],
    description: [{ code: "en-US", content: "The end of day report request data." }],
})
export class GetEndOfDayReportFunction {
    async run(context: FunctionContext, data: EndOfDayRequestData): Promise<EndOfDayResponseData> {
        const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

        try {
            const result = await axios.post(
                `${url}/rs/shipments/endofday?date=${data.date}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${await getAuthToken(context)}`,
                        "Content-Type": "application/glsVersion1+json",
                    },
                }
            );
            return EndOfDayResponseDataSchema.parse(result.data);
        } catch (error: any) {
            throw new RuntimeError("GET_END_OF_DAY_INFO_FAILED", error.toString());
        }
    }
}
