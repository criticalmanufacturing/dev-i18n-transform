export class Translation {
    public readonly language: string;
    public readonly text: string;

    /**
     * Is the translation literal?
     * A literal translation is a translation that doesn't need any kind of translation.
     * Eg. LABEL: i18n.ID
     */
    public readonly isLiteral: boolean;

    constructor(language: string, text: string, isLiteral: boolean = false) {
        this.language = language;
        this.text = text;
        this.isLiteral = isLiteral;
    }
}