import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_END_OF_DAY_REQUEST_DATA",
            type: types.get("GLS_END_OF_DAY_REQUEST_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "End of day request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "End of day request data"
                }
            ]
        },
        {
            identifier: "GLS_END_OF_DAY_RESPONSE_DATA",
            type: types.get("GLS_END_OF_DAY_RESPONSE_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "End of day response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "End of day response data"
                }
            ]
        },
    )
}
