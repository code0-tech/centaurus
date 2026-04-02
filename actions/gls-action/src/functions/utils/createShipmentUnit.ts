import {ActionSdk} from "@code0-tech/hercules";
import { UnitService } from "../../types/glsUnitService";
import {ShipmentUnit} from "../../types/glsShipmentUnit";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createShipmentUnit",
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create shipment unit"
                    }
                ],
                signature: "(weight: number, shipmentUnitReference?: string, partnerParcelNumber?: string, note1?: string, note2?: string, shipmentUnitService: GLS_SHIPMENT_UNIT_SERVICE): GLS_SHIPMENT_UNIT",
                name: [
                    {
                        code: "en-US",
                        content: "Create shipment unit",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS shipment unit object which can be used for shipments.",
                    }
                ],
                parameters: [
                    {
                        runtimeName: "weight",
                        name: [
                            {
                                code: "en-US",
                                content: "Weight (kg)",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The weight of the shipment unit in kilograms. Must be a positive number and greater than 0.10 and less than 99.",
                            }
                        ]
                    },
                    {
                        runtimeName: "shipmentUnitReference",
                        name: [
                            {
                                code: "en-US",
                                content: "Shipment unit reference",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The reference for the shipment unit. Max length is 40 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "partnerParcelNumber",
                        name: [
                            {
                                code: "en-US",
                                content: "Partner parcel number",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The partner parcel number for the shipment unit. Max length is 50 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "note1",
                        name: [
                            {
                                code: "en-US",
                                content: "Note 1",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "Note 1 for the shipment unit. Max length is 50 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "note2",
                        name: [
                            {
                                code: "en-US",
                                content: "Note 2",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "Note 2 for the shipment unit. Max length is 50 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "shipmentUnitService",
                        name: [
                            {
                                code: "en-US",
                                content: "Shipment unit service",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The service associated with the shipment unit.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_SHIPMENT_UNIT",
                ]
            },
            handler: (weight: number, shipmentUnitReference: string, partnerParcelNumber?: string, note1?: string, note2?: string, shipmentUnitService?: UnitService): ShipmentUnit => {
                return {
                    ShipmentUnitReference: shipmentUnitReference,
                    Weight: weight,
                    PartnerParcelNumber: partnerParcelNumber,
                    Note1: note1,
                    Note2: note2,
                    Service: shipmentUnitService
                }
            }
        },
    )
}