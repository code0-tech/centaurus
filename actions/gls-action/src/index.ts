import {createSdk} from "@code0-tech/hercules"
import {
    loadAllDefinitions
} from "./helpers";

export const sdk = createSdk({
    authToken: process.env.HERCULES_AUTH_TOKEN || "",
    aquilaUrl: process.env.HERCULES_AQUILA_URL || "127.0.0.1:50051",
    actionId: process.env.HERCULES_ACTION_ID || "gls-action",
    version: process.env.HERCULES_SDK_VERSION || "0.0.0",
})

async function main() {
    try {
        await loadAllDefinitions(sdk)
        connectToSdk()
    } catch (error) {
        console.error(error)
    }
}
main().catch(err => {
    console.error(err)
    process.exit(1)
})


function connectToSdk() {
    sdk.connect().then(() => {
        console.log("SDK connected successfully");
    }).catch(() => {
        console.error("Error connecting SDK:");
    })

    sdk.onError((error) => {
        console.error("SDK Error occurred:", error.message);
        console.log("Attempting to reconnect in 5s...");
        setTimeout(() => {
            connectToSdk();
        }, 5000)
    })
}