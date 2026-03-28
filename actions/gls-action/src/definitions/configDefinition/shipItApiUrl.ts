import {ActionSdk} from "@code0-tech/hercules";

export function register(sdk: ActionSdk) {
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
