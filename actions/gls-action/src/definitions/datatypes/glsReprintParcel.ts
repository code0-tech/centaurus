import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_REPRINT_PARCEL_REQUEST_DATA",
            type: types.get("GLS_REPRINT_PARCEL_REQUEST_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Reprint parcel request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Reprint parcel request data"
                }
            ]
        },
        {
            identifier: "GLS_REPRINT_PARCEL_RESPONSE_DATA",
            type: types.get("GLS_REPRINT_PARCEL_RESPONSE_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Reprint parcel response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Reprint parcel response data"
                }
            ]
        },
    )
}
