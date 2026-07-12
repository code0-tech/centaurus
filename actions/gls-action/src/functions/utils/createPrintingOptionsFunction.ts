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
import {LabelFormat, PrintingOptions, TemplateSet} from "../../data_types/glsPrintingOptions.js";

@Identifier("createPrintingOptions")
@Signature("(TemplateSet?: GLS_TEMPLATE_SET, LabelFormat?: GLS_LABEL_FORMAT, UseDefault?: string, LabelPrinter?: string, DocumentPrinter?: string): GLS_PRINTING_OPTIONS")
@Name({code: "en-US", content: "Create GLS printing settings"})
@DisplayIcon("codezero:gls")
@DisplayMessage({code: "en-US", content: "Create GLS printing settings in format ${TemplateSet} as ${LabelFormat}"})
@Documentation({
    code: "en-US",
    content: "Creates a GLS printing options object that controls how shipment labels are generated and printed.",
})
@Description({
    code: "en-US",
    content: "Creates a GLS printing options object that controls how shipment labels are generated and printed.",
})
@Parameter({
    runtimeName: "TemplateSet",
    name: [{code: "en-US", content: "Template set"}],
    description: [{
        code: "en-US",
        content: "The label template set to use for return labels. Required together with LabelFormat to generate return labels."
    }],
    optional: true,
})
@Parameter({
    runtimeName: "LabelFormat",
    name: [{code: "en-US", content: "Label format"}],
    description: [{
        code: "en-US",
        content: "The file format for return labels. Required together with TemplateSet to generate return labels."
    }],
    optional: true,
})
@Parameter({
    runtimeName: "UseDefault",
    name: [{code: "en-US", content: "Use default"}],
    description: [{code: "en-US", content: "Identifier of the default printing profile to use. Max 7 characters."}],
    optional: true,
})
@Parameter({
    runtimeName: "LabelPrinter",
    name: [{code: "en-US", content: "Label printer"}],
    description: [{code: "en-US", content: "Name of the printer to use for shipment labels. Max 255 characters."}],
    optional: true,
})
@Parameter({
    runtimeName: "DocumentPrinter",
    name: [{code: "en-US", content: "Document printer"}],
    description: [{code: "en-US", content: "Name of the printer to use for documents. Max 255 characters."}],
    optional: true,
})
export class CreatePrintingOptionsFunction {
    run(
        _context: unknown,
        TemplateSet?: TemplateSet,
        LabelFormat?: LabelFormat,
        UseDefault?: string,
        LabelPrinter?: string,
        DocumentPrinter?: string,
    ): PrintingOptions {
        return {
            ...(TemplateSet && LabelFormat ? {ReturnLabels: {TemplateSet, LabelFormat}} : {}),
            ...(UseDefault !== undefined ? {UseDefault} : {}),
            ...((LabelPrinter || DocumentPrinter) ? {
                DefinePrinter: {
                    ...(LabelPrinter !== undefined ? {LabelPrinter} : {}),
                    ...(DocumentPrinter !== undefined ? {DocumentPrinter} : {}),
                },
            } : {}),
        };
    }
}
