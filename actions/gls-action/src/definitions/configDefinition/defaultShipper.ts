import {sdk} from "../../index";

export function register() {
    return sdk.registerConfigDefinitions(
        {
            identifier: "default_shipper",
            type: "GLS_SHIPPER",
            name: [
                {
                    code: "en-US",
                    content: "Shipper"
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "The shipper information to use for the shipments. This will be used if the shipper information is not provided in the shipment data."
                }
            ],
            linkedDataTypes: ["GLS_SHIPPER"]
        }
    )
}