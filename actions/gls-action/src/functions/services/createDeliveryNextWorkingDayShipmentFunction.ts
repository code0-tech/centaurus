import {
    Description,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    RuntimeError,
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

@Identifier("createDeliveryNextWorkingDayShipment")
@Signature(`(${SHARED_SERVICE_SIGNATURE}): GLS_CREATE_PARCELS_RESPONSE`)
@Name({ code: "en-US", content: "Create delivery next working day shipment" })
@DisplayMessage({ code: "en-US", content: "Create delivery next working day shipment" })
@Documentation({
    code: "en-US",
    content: "Creates an EXPRESS shipment for delivery on the next working day (EOB service).",
})
@Description({
    code: "en-US",
    content: "Creates an EXPRESS shipment for delivery on the next working day (EOB service).",
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
export class CreateDeliveryNextWorkingDayShipmentFunction {
    async run(
        context: FunctionContext,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions
    ): Promise<CreateParcelsResponse> {
        if (shipment.Product != "EXPRESS") {
            throw new RuntimeError("INVALID_PRODUCT", "The product for Delivery Next Working Day service must be EXPRESS.");
        }
        return postShipmentHelper(context, [{ Service: { ServiceName: "service_eob" } }], shipment, printingOptions, customContent, returnOptions);
    }
}
