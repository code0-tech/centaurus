import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_CANCEL_SHIPMENT_REQUEST_DATA",
            type: types.get("GLS_CANCEL_SHIPMENT_REQUEST_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Cancel shipment request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Cancel shipment request data"
                }
            ]
        },
        {
            identifier: "GLS_CANCEL_SHIPMENT_RESPONSE_DATA",
            type: types.get("GLS_CANCEL_SHIPMENT_RESPONSE_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Cancel shipment response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Cancel shipment response data"
                }
            ]
        }
    )
}
