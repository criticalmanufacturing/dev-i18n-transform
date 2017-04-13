
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
     * Line number
     */
    line: number;
    /**
     * Col number
     */
    col: number;
}