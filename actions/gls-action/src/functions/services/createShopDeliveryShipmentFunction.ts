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

@Identifier("createShopDeliveryShipment")
@Signature(`(parcelShopId: string, ${SHARED_SERVICE_SIGNATURE}): GLS_CREATE_PARCELS_RESPONSE`)
@Name({ code: "en-US", content: "Create shop delivery shipment" })
@DisplayMessage({ code: "en-US", content: "Create shop delivery shipment" })
@Documentation({
    code: "en-US",
    content: "Delivers a parcel to a GLS Parcel Shop where the recipient can collect it.",
})
@Description({
    code: "en-US",
    content: "Delivers a parcel to a GLS Parcel Shop where the recipient can collect it.",
})
@Parameter({
    runtimeName: "parcelShopId",
    name: [{ code: "en-US", content: "Parcel shop Id" }],
    description: [{ code: "en-US", content: "The ID of the parcel shop where the shipment should be delivered." }],
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
export class CreateShopDeliveryShipmentFunction {
    async run(
        context: FunctionContext,
        parcelShopId: string,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(
            context,
            [{ ShopDelivery: { ParcelShopID: parcelShopId } }],
            shipment,
            printingOptions,
            customContent,
            returnOptions
        );
    }
}
