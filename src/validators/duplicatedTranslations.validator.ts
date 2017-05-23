import { Validator, ValidationResult, ValidationResultType } from "./validator.interface";
import { Package } from "../model/package";
import Util from "../util";

export class DuplicatedTranslationsValidator implements Validator {

    private _pack: Package;

    constructor(pack: Package) {
        this._pack = pack;
    }

    /**
     * Run the validator
     *
     * @returns A list of validation results.
     */
    validate(): ValidationResult[] {

        let knownTranslations = new Map<string, number>();
        let validationResults: ValidationResult[] = [];

        this._pack.files.forEach((file) => {
            file.messages.forEach((message) => {
                let translatedMessage = message.getTranslation(Util.defaultLanguage);

                // skip null translations
                if (!translatedMessage) return;
                // skip literal translations - they don't need to be validated
                if (translatedMessage.isLiteral) return;

                if (knownTranslations.has(translatedMessage.text)) {
                    validationResults.push({
                        file: file,
                        type: ValidationResultType.Error,
                        message: `Duplicated resource '${translatedMessage.text}' for ${Util.defaultLanguage}`,
                        col: translatedMessage.column,
                        line: translatedMessage.line
                    });

                    knownTranslations.set(translatedMessage.text, knownTranslations.get(translatedMessage.text) + 1);
                } else {
                    knownTranslations.set(translatedMessage.text, 1);
                }
            });
        });

        return validationResults;
    }
}