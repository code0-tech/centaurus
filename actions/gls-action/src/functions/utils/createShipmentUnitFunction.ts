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
import {UnitService} from "../../data_types/glsUnitService.js";
import {ShipmentUnit} from "../../data_types/glsShipmentUnit.js";

@Identifier("createShipmentUnit")
@Signature("(weight: number, shipmentUnitReference?: string, partnerParcelNumber?: string, note1?: string, note2?: string, shipmentUnitService?: GLS_UNIT_SERVICE): GLS_SHIPMENT_UNIT")
@Name({code: "en-US", content: "Create GLS shipment unit object"})
@DisplayIcon("codezero:gls")
@DisplayMessage({code: "en-US", content: "Create GLS shipment unit object of weight ${weight}"})
@Documentation({
    code: "en-US",
    content: "Creates a GLS shipment unit (an individual parcel within a shipment).",
})
@Description({
    code: "en-US",
    content: "Creates a GLS shipment unit object which can be used for shipments.",
})
@Parameter({
    runtimeName: "weight",
    name: [{code: "en-US", content: "Weight (kg)"}],
    description: [{
        code: "en-US",
        content: "The weight of the shipment unit in kilograms. Must be a positive number and greater than 0.10 and less than 99."
    }],
})
@Parameter({
    runtimeName: "shipmentUnitReference",
    name: [{code: "en-US", content: "Shipment unit reference"}],
    description: [{code: "en-US", content: "The reference for the shipment unit. Max length is 40 characters."}],
})
@Parameter({
    runtimeName: "partnerParcelNumber",
    name: [{code: "en-US", content: "Partner parcel number"}],
    description: [{
        code: "en-US",
        content: "The partner parcel number for the shipment unit. Max length is 50 characters."
    }],
})
@Parameter({
    runtimeName: "note1",
    name: [{code: "en-US", content: "Note 1"}],
    description: [{code: "en-US", content: "Note 1 for the shipment unit. Max length is 50 characters."}],
})
@Parameter({
    runtimeName: "note2",
    name: [{code: "en-US", content: "Note 2"}],
    description: [{code: "en-US", content: "Note 2 for the shipment unit. Max length is 50 characters."}],
})
@Parameter({
    runtimeName: "shipmentUnitService",
    name: [{code: "en-US", content: "Shipment unit service"}],
    description: [{code: "en-US", content: "The service associated with the shipment unit."}],
})
export class CreateShipmentUnitFunction {
    run(
        _context: unknown,
        weight: number,
        shipmentUnitReference?: string,
        partnerParcelNumber?: string,
        note1?: string,
        note2?: string,
        shipmentUnitService?: UnitService
    ): ShipmentUnit {
        return {
            ShipmentUnitReference: shipmentUnitReference,
            Weight: weight,
            PartnerParcelNumber: partnerParcelNumber,
            Note1: note1,
            Note2: note2,
            Service: shipmentUnitService,
        };
    }
}
