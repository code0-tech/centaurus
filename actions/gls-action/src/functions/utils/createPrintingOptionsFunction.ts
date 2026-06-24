import {
    Description,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { PrintingOptions, ReturnLabels } from "../../data_types/glsPrintingOptions.js";

@Identifier("createPrintingOptions")
@Signature("(returnLabels: RETURN_LABELS): GLS_PRINTING_OPTIONS")
@Name({ code: "en-US", content: "Create printing options" })
@DisplayMessage({ code: "en-US", content: "Create printing options" })
@Documentation({
    code: "en-US",
    content: "Creates GLS printing options that control how labels are generated.",
})
@Description({
    code: "en-US",
    content: "Creates a GLS printing options object which can be used when creating shipments.",
})
@Parameter({
    runtimeName: "returnLabels",
    name: [{ code: "en-US", content: "Return labels" }],
    description: [{ code: "en-US", content: "The return labels to be included in the shipment." }],
})
export class CreatePrintingOptionsFunction {
    run(_context: unknown, returnLabels: ReturnLabels): PrintingOptions {
        return {
            ReturnLabels: returnLabels,
        };
    }
}
