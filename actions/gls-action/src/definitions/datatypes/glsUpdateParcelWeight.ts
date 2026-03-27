import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA",
            type: types.get("GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Update parcel weight request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Update parcel weight request data"
                }
            ]
        },
        {
            identifier: "GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA",
            type: types.get("GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Update parcel weight response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Update parcel weight response data"
                }
            ]
        },
    )
}
