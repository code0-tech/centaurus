import {
    Description,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
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

@Identifier("createFlexDeliveryShipment")
@Signature(`(${SHARED_SERVICE_SIGNATURE}): GLS_CREATE_PARCELS_RESPONSE`)
@Name({ code: "en-US", content: "Create flex delivery shipment" })
@DisplayMessage({ code: "en-US", content: "Create flex delivery shipment" })
@Documentation({
    code: "en-US",
    content: "Creates a shipment with flexible delivery - the recipient can redirect or reschedule delivery.",
})
@Description({
    code: "en-US",
    content: "Creates a shipment with flexible delivery - the recipient can redirect or reschedule delivery.",
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
export class CreateFlexDeliveryShipmentFunction {
    async run(
        context: FunctionContext,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(context, [{ FlexDeliveryService: {} }], shipment, printingOptions, customContent, returnOptions);
    }
}
