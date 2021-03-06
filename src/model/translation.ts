export class Translation {
    public readonly language: string;
    public readonly text: string;

    public readonly line: number;
    public readonly column: number;

    /**
     * Is the translation literal?
     * A literal translation is a translation that doesn't need any kind of translation.
     * Eg. LABEL: i18n.ID
     */
    public readonly isLiteral: boolean;

    constructor(language: string, text: string, isLiteral: boolean = false, line: number = null, col: number = null) {
        this.language = language;
        this.text = text;
        this.isLiteral = isLiteral;

        this.line = line;
        this.column = col;
    }
}

export enum TranslatorNotes {
    AutomaticTranslation = 1
}

/**
 * Notes for translators.
 * Keys are based on {@see TranslatorNotes} enumeration.
 */
export const TRANSLATOR_NOTES: {[key: number]: string} = Object.freeze({
    1: "001 | Automatic Translation"
});