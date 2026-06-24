import {
    Description,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { postShipmentHelper } from "../../helpers.js";
import { ShipmentWithoutServices } from "../../data_types/glsShipment.js";
import { CreateParcelsResponse } from "../../data_types/glsCreateParcelsResponse.js";
import { PrintingOptions } from "../../data_types/glsPrintingOptions.js";
import { CustomContent } from "../../data_types/glsCustomContent.js";
import { ReturnOptions } from "../../data_types/glsReturnOptions.js";
import {
    SHARED_SERVICE_SIGNATURE,
    SharedCustomContentParameter,
    SharedPrintingOptionsParameter,
    SharedReturnOptionsParameter,
    SharedShipmentParameter,
} from "./_shared.js";

@Identifier("createShopReturnShipment")
@Signature(
    `(numberOfLabels: number, ${SHARED_SERVICE_SIGNATURE}, returnQR?: "PDF" | "PNG" | "ZPL"): GLS_CREATE_PARCELS_RESPONSE`
)
@Name({ code: "en-US", content: "Create shop return shipment" })
@DisplayMessage({ code: "en-US", content: "Create shop return shipment" })
@Documentation({
    code: "en-US",
    content: "Creates a return shipment from a GLS Parcel Shop (customer drops off parcel at a shop).",
})
@Description({
    code: "en-US",
    content: "Creates a return shipment from a GLS Parcel Shop (customer drops off parcel at a shop).",
})
@Parameter({
    runtimeName: "numberOfLabels",
    name: [{ code: "en-US", content: "The number of labels" }],
    description: [{ code: "en-US", content: "The number of labels to be created for the return shipment." }],
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
@Parameter({
    runtimeName: "returnQR",
    name: [{ code: "en-US", content: "Return QR" }],
    description: [{ code: "en-US", content: "The return QR of the shipment." }],
    optional: true,
})
export class CreateShopReturnShipmentFunction {
    async run(
        context: FunctionContext,
        numberOfLabels: number,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions,
        returnQR?: "PDF" | "PNG" | "ZPL"
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(
            context,
            [{ ShopReturn: { NumberOfLabels: numberOfLabels, ReturnQR: returnQR } }],
            shipment,
            printingOptions,
            customContent,
            returnOptions
        );
    }
}
