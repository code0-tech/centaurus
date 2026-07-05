import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import {CustomContent} from "../../data_types/glsCustomContent.js";

@Identifier("createCustomContent")
@Signature("(barcodeContentType: \"TRACK_ID\"|\"GLS_SHIPMENT_REFERENCE\", customerLogo: string, hideShipperAddress?: boolean, barcodeType?: \"EAN_128\"|\"CODE_39\", barcode?: string): GLS_CUSTOM_CONTENT")
@Name({code: "en-US", content: "Create custom content"})
@DisplayIcon("tabler:truck-delivery")
@DisplayMessage({code: "en-US", content: "Create custom content"})
@Documentation({
    code: "en-US",
    content: "Creates custom content settings for GLS labels, including logos and barcodes.",
})
@Description({
    code: "en-US",
    content: "Creates a GLS custom content object for shipment labels.",
})
@Parameter({
    runtimeName: "barcodeContentType",
    name: [{code: "en-US", content: "Barcode content type"}],
    description: [{
        code: "en-US",
        content: "Type of content encoded in the barcode (TRACK_ID or GLS_SHIPMENT_REFERENCE)."
    }],
})
@Parameter({
    runtimeName: "customerLogo",
    name: [{code: "en-US", content: "Customer logo"}],
    description: [{code: "en-US", content: "Base64-encoded customer logo to print on the label."}],
})
@Parameter({
    runtimeName: "hideShipperAddress",
    name: [{code: "en-US", content: "Hide shipper address"}],
    description: [{code: "en-US", content: "Whether to hide the shipper address on the label."}],
})
@Parameter({
    runtimeName: "barcodeType",
    name: [{code: "en-US", content: "Barcode type"}],
    description: [{code: "en-US", content: "Type of barcode to use (EAN_128 or CODE_39)."}],
})
@Parameter({
    runtimeName: "barcode",
    name: [{code: "en-US", content: "Barcode"}],
    description: [{code: "en-US", content: "Barcode value to print on the label."}],
})
export class CreateCustomContentFunction {
    run(
        _context: unknown,
        barcodeContentType: CustomContent["BarcodeContentType"],
        customerLogo: string,
        hideShipperAddress?: boolean,
        barcodeType?: CustomContent["BarcodeType"],
        barcode?: string
    ): CustomContent {
        return {
            Barcode: barcode,
            BarcodeContentType: barcodeContentType,
            BarcodeType: barcodeType,
            CustomerLogo: customerLogo,
            HideShipperAddress: hideShipperAddress,
        };
    }
}
