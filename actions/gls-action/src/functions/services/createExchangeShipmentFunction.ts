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
import { Address } from "../../data_types/glsAddress.js";
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

@Identifier("createExchangeShipment")
@Signature(`(address: GLS_ADDRESS, ${SHARED_SERVICE_SIGNATURE}, expectedWeight?: number): GLS_CREATE_PARCELS_RESPONSE`)
@Name({ code: "en-US", content: "Create exchange shipment" })
@DisplayMessage({ code: "en-US", content: "Create exchange shipment" })
@Documentation({
    code: "en-US",
    content: "Delivers a new parcel while simultaneously picking up an existing one (exchange).",
})
@Description({
    code: "en-US",
    content: "Delivers a new parcel while simultaneously picking up an existing one (exchange).",
})
@Parameter({
    runtimeName: "address",
    name: [{ code: "en-US", content: "Address" }],
    description: [{ code: "en-US", content: "The address of the exchange shipment." }],
})
@SharedShipmentParameter
@SharedPrintingOptionsParameter
@SharedCustomContentParameter
@SharedReturnOptionsParameter
@Parameter({
    runtimeName: "expectedWeight",
    name: [{ code: "en-US", content: "Expected weight" }],
    description: [{ code: "en-US", content: "The expected weight for the exchange shipment." }],
    optional: true,
})
export class CreateExchangeShipmentFunction {
    async run(
        context: FunctionContext,
        address: Address,
        shipment: ShipmentWithoutServices,
        printingOptions: PrintingOptions,
        customContent?: CustomContent,
        returnOptions?: ReturnOptions,
        expectedWeight?: number
    ): Promise<CreateParcelsResponse> {
        return postShipmentHelper(
            context,
            [{ Exchange: { Address: address, ExpectedWeight: expectedWeight } }],
            shipment,
            printingOptions,
            customContent,
            returnOptions
        );
    }
}
