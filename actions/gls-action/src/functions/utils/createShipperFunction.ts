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
import {Address} from "../../data_types/glsAddress.js";
import {ShipperSchemaType} from "../../data_types/glsShipper.js";

@Identifier("createShipper")
@Signature("(Address?: GLS_ADDRESS, AlternativeShipperAddress?: GLS_ADDRESS): GLS_SHIPPER")
@Name({code: "en-US", content: "Create shipper for shipment"})
@DisplayIcon("tabler:truck-delivery")
@DisplayMessage({code: "en-US", content: "Create shipper for shipment"})
@Documentation({
    code: "en-US",
    content: "Creates a GLS shipper object for use in shipments.",
})
@Description({
    code: "en-US",
    content: "Creates a GLS shipper object for use in shipments.",
})
@Parameter({
    runtimeName: "Address",
    name: [{code: "en-US", content: "Address"}],
    description: [{code: "en-US", content: "The primary address of the shipper."}],
    optional: true,
})
@Parameter({
    runtimeName: "AlternativeShipperAddress",
    name: [{code: "en-US", content: "Alternative shipper address"}],
    description: [{
        code: "en-US",
        content: "An alternative address for the shipper, used when the shipment originates from a different location."
    }],
    optional: true,
})
export class CreateShipperFunction {
    run(
        _context: unknown,
        Address?: Address,
        AlternativeShipperAddress?: Address
    ): ShipperSchemaType {
        return {
            Address,
            AlternativeShipperAddress,
        };
    }
}
