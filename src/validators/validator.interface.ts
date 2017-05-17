import {File} from "../model/file";

/**
 * Validator interface
 */
export interface Validator {
    /**
     * Run the validator
     * @returns A list of validation results; empty if there were no issues found.
     */
    validate(): ValidationResult[];
}

/**
 * Validation Result Result
 */
export enum ValidationResultType {
    Debug,
    Information,
    Warning,
    Error
}

/**
 * Validation Result literal
 */
export interface ValidationResult {
    /**
     * Type of the validation result
     */
    type: ValidationResultType;
    /**
     * Validation message
     */
    message: string;
    /**
     * File
     */
    file: File;
    /**
     * Line number
     */
    line: number;
    /**
     * Col number
     */
    col: number;
}