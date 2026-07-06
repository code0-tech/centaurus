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

@Identifier("createIdentShipment")
@Signature(
    `(birthDate: string, firstName: string, lastName: string, nationality: string, ${SHARED_SERVICE_SIGNATURE}): GLS_CREATE_PARCELS_RESPONSE`
)
@Name({ code: "en-US", content: "Create ident shipment" })
@DisplayMessage({ code: "en-US", content: "Create ident shipment" })
@Documentation({
    code: "en-US",
    content: "Delivers a parcel with identity verification - the driver checks the recipient's ID document.",
})
@Description({
    code: "en-US",
    content: "Delivers a parcel with identity verification - the driver checks the recipient's ID document.",
})
@Parameter({
    runtimeName: "birthDate",
    name: [{ code: "en-US", content: "Birth date" }],
    description: [{ code: "en-US", content: "The birth date for the ident shipment identification." }],
})
@Parameter({
    runtimeName: "firstName",
    name: [{ code: "en-US", content: "First name" }],
    description: [{ code: "en-US", content: "The first name for the ident shipment identification." }],
})
@Parameter({
    runtimeName: "lastName",
    name: [{ code: "en-US", content: "Last name" }],
    description: [{ code: "en-US", content: "The last name for the ident shipment identification." }],
})
@Parameter({
    runtimeName: "nationality",
    name: [{ code: "en-US", content: "Nationality" }],
    description: [{ code: "en-US", content: "The nationality for the ident shipment identification." }],
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
export class CreateIdentShipmentFunction {
    async run(
        context: FunctionContext,
        birthDate: string,
        firstName: string,
        lastName: string,
        nationality: string,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(
            context,
            [
                {
                    Ident: {
                        Birthdate: birthDate,
                        Firstname: firstName,
                        Lastname: lastName,
                        Nationality: nationality,
                    },
                },
            ],
            shipment,
            printingOptions,
            customContent,
            returnOptions
        );
    }
}
