import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
            type: types.get("GLS_VALIDATE_SHIPMENT_REQUEST_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Validate shipment request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Validate shipment request data"
                }
            ]
        },
        {
            identifier: "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
            type: types.get("GLS_VALIDATE_SHIPMENT_RESPONSE_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Validate shipment response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Validate shipment response data"
                }
            ]
        },
    )
}
