import * as path from "path";
import { Validator, ValidationResult } from "./validator.interface";
import { DuplicatedTranslationsValidator } from "./duplicatedTranslations.validator";
import { Package } from "../model/package";
export { Validator, ValidationResult };

export class ValidatorFactory {

    /**
     * Gets all the validators for specified language.
     *
     * @param pack Package to validate
     */
    public static getValidators(pack: Package): Validator[] {
        let validators: Validator[] = [];
        let language: string;

        if (pack.files != null && pack.files.length > 0) {
            language = path.extname(pack.files[0].uniqueFileName);
        }
        else {
            return validators;
        }

        switch (language) {
            case ".ts":
                validators.push(new DuplicatedTranslationsValidator(pack));
                break;
            case ".po":
                // none yet
                break;
            default:
                throw new Error("Not Implemented Yet");
        }

        return validators;
    }

    /**
     * Validates all files of given package.
     *
     * @param pack Package to validate
     */
    public static validate(pack: Package): ValidationResult[] {
        // Get validators for language
        let validators = ValidatorFactory.getValidators(pack);

        // Call all validators and collect results
        let validationResults = validators.map((validator) => validator.validate());

        // Flatten results and return
        return [].concat.apply([], validationResults);
    }
}