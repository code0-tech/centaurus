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

@Identifier("createIdentPinShipment")
@Signature(`(pin: string, ${SHARED_SERVICE_SIGNATURE}, birthDate?: string): GLS_CREATE_PARCELS_RESPONSE`)
@Name({ code: "en-US", content: "Create ident pin shipment" })
@DisplayMessage({ code: "en-US", content: "Create ident pin shipment" })
@Documentation({
    code: "en-US",
    content: "Delivers a parcel with PIN and optional birthdate verification.",
})
@Description({
    code: "en-US",
    content: "Delivers a parcel with PIN and optional birthdate verification.",
})
@Parameter({
    runtimeName: "pin",
    name: [{ code: "en-US", content: "Pin" }],
    description: [{ code: "en-US", content: "The pin for the ident pin shipment identification." }],
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
@Parameter({
    runtimeName: "birthDate",
    name: [{ code: "en-US", content: "Birth date" }],
    description: [{ code: "en-US", content: "The birth date for the ident pin shipment identification." }],
    optional: true,
})
export class CreateIdentPinShipmentFunction {
    async run(
        context: FunctionContext,
        pin: string,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions,
        birthDate?: string
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(
            context,
            [{ IdentPin: { PIN: pin, Birthdate: birthDate } }],
            shipment,
            printingOptions,
            customContent,
            returnOptions
        );
    }
}
