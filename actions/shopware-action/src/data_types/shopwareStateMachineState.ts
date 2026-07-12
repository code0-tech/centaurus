import {Identifier, Name, Schema} from "@code0-tech/hercules";
import {schemas} from "../generated/shopware-schemas.ts";

@Identifier("ShopwareStateMachineState")
@Name({code: "en-US", content: "ShopwareStateMachineState"})
@Schema(schemas.StateMachineState)
export class ShopwareStateMachineState {
}
