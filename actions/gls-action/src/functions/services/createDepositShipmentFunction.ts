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

@Identifier("createDepositShipment")
@Signature(`(placeOfDeposit: string, ${SHARED_SERVICE_SIGNATURE}): GLS_CREATE_PARCELS_RESPONSE`)
@Name({ code: "en-US", content: "Create deposit shipment" })
@DisplayMessage({ code: "en-US", content: "Create deposit shipment" })
@Documentation({
    code: "en-US",
    content: "Delivers a parcel to a designated deposit location (e.g. a garage or shed) without requiring a signature.",
})
@Description({
    code: "en-US",
    content: "Delivers a parcel to a designated deposit location (e.g. a garage or shed) without requiring a signature.",
})
@Parameter({
    runtimeName: "placeOfDeposit",
    name: [{ code: "en-US", content: "Place of deposit" }],
    description: [{ code: "en-US", content: "The place of deposit for the delivery." }],
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
export class CreateDepositShipmentFunction {
    async run(
        context: FunctionContext,
        placeOfDeposit: string,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(
            context,
            [{ Deposit: { PlaceOfDeposit: placeOfDeposit } }],
            shipment,
            printingOptions,
            customContent,
            returnOptions
        );
    }
}
