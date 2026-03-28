import {sdk} from "../../index";

export function register() {
    return sdk.registerConfigDefinitions(
        {
            identifier: "ship_it_api_url",
            type: "TEXT",
            defaultValue: " https://api.gls-group.net/shipit-farm/v1/backend/rs",
            name: [
                {
                    code: "en-US",
                    content: "The ShipIt API url"
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "The url of the GLS ShipIt API."
                }
            ],
            linkedDataTypes: ["TEXT"],
        },
    )
}
