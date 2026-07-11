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
    EndOfDayResponseData,
    EndOfDayResponseDataSchema,
} from "../data_types/glsEndOfDay.js";

@Identifier("getEndOfDayReport")
@DisplayIcon("codezero:gls")
@Signature("(date: string): GLS_END_OF_DAY_RESPONSE_DATA")
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
    runtimeName: "date",
    name: [{ code: "en-US", content: "Date" }],
    description: [{ code: "en-US", content: "The dispatch date to retrieve shipments for, in ISO format (YYYY-MM-DD)." }],
})
export class GetEndOfDayReportFunction {
    async run(context: FunctionContext, date: string): Promise<EndOfDayResponseData> {
        const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

        try {
            const result = await axios.post(
                `${url}/rs/shipments/endofday?date=${date}`,
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
