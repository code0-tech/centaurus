import {
    Description, DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import {Consignee} from "../../data_types/glsConsignee.js";
import {Address} from "../../data_types/glsAddress.js";
import {ShipperSchemaType} from "../../data_types/glsShipper.js";
import {ShipmentUnit} from "../../data_types/glsShipmentUnit.js";
import {ShipmentWithoutServices} from "../../data_types/glsShipment.js";

@Identifier("createShipment")
@Signature("(Consignee: GLS_CONSIGNEE, ShipmentUnit: GLS_SHIPMENT_UNIT, Product?: \"PARCEL\"|\"EXPRESS\", ShipmentReference?: string, ShippingDate?: string, IncotermCode?: number, Identifier?: string, ExpressAltDeliveryAllowed?: boolean, Shipper?: GLS_SHIPPER, Carrier?: \"ROYALMAIL\", Return?: GLS_ADDRESS): GLS_SHIPMENT_WITHOUT_SERVICES")
@Name({code: "en-US", content: "Create parcel shipment"})
@DisplayIcon("tabler:truck-delivery")
@DisplayMessage({code: "en-US", content: "Create parcel shipment"})
@Documentation({
    code: "en-US",
    content: "Creates a GLS shipment object without services for use with the create shipment functions.",
})
@Description({
    code: "en-US",
    content: "Creates a GLS shipment object without services for use with the create shipment functions.",
})
@Parameter({
    runtimeName: "Consignee",
    name: [{code: "en-US", content: "Consignee"}],
    description: [{code: "en-US", content: "The recipient of the shipment."}],
})
@Parameter({
    runtimeName: "ShipmentUnit",
    name: [{code: "en-US", content: "Shipment unit"}],
    description: [{
        code: "en-US",
        content: "One or more parcels included in this shipment. At least one unit is required."
    }],
})
@Parameter({
    runtimeName: "Product",
    name: [{code: "en-US", content: "Product"}],
    description: [{code: "en-US", content: "The GLS product type for the shipment. Defaults to PARCEL."}],
    optional: true,
})
@Parameter({
    runtimeName: "ShipmentReference",
    name: [{code: "en-US", content: "Shipment reference"}],
    description: [{code: "en-US", content: "A customer-defined reference for the shipment. Max 40 characters."}],
    optional: true,
})
@Parameter({
    runtimeName: "ShippingDate",
    name: [{code: "en-US", content: "Shipment date"}],
    description: [{
        code: "en-US",
        content: "The date the shipment is handed over to GLS, in ISO 8601 date format (YYYY-MM-DD)."
    }],
    optional: true,
})
@Parameter({
    runtimeName: "IncotermCode",
    name: [{code: "en-US", content: "Incoterm code"}],
    description: [{code: "en-US", content: "Numeric incoterm code for the shipment. Max value is 99."}],
    optional: true,
})
@Parameter({
    runtimeName: "Identifier",
    name: [{code: "en-US", content: "Identifier"}],
    description: [{
        code: "en-US",
        content: "An additional customer-defined identifier for the shipment. Max 40 characters."
    }],
    optional: true,
})
@Parameter({
    runtimeName: "ExpressAltDeliveryAllowed",
    name: [{code: "en-US", content: "Express alternative delivery allowed"}],
    description: [{code: "en-US", content: "Whether an alternative delivery is permitted for express shipments."}],
    optional: true,
})
@Parameter({
    runtimeName: "Shipper",
    name: [{code: "en-US", content: "Shipper"}],
    description: [{
        code: "en-US",
        content: "The shipper for this shipment. If not provided, the default shipper from the action configuration is used."
    }],
    optional: true,
})
@Parameter({
    runtimeName: "Carrier",
    name: [{code: "en-US", content: "Carrier"}],
    description: [{
        code: "en-US",
        content: "The carrier to use for the shipment. Currently only ROYALMAIL is supported."
    }],
    optional: true,
})
@Parameter({
    runtimeName: "Return",
    name: [{code: "en-US", content: "Return address"}],
    description: [{
        code: "en-US",
        content: "The return address for the shipment. If provided, a return label is generated."
    }],
    optional: true,
})
export class CreateShipmentFunction {
    run(
        _context: unknown,
        Consignee: Consignee,
        ShipmentUnit: ShipmentUnit[],
        Product?: "PARCEL" | "EXPRESS",
        ShipmentReference?: string,
        ShippingDate?: string,
        IncotermCode?: number,
        Identifier?: string,
        ExpressAltDeliveryAllowed?: boolean,
        Shipper?: ShipperSchemaType,
        Carrier?: "ROYALMAIL",
        Return?: Address,
    ): ShipmentWithoutServices {
        return {
            Consignee,
            ShipmentUnit,
            Product: Product ?? "PARCEL",
            ShipmentReference,
            ShippingDate,
            IncotermCode,
            Identifier,
            ExpressAltDeliveryAllowed,
            Shipper,
            Carrier,
            Return,
        };
    }
}
