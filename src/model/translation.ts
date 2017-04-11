export class Translation {
    public readonly language: string;
    public readonly text: string;

    constructor(language: string, text: string) {
        this.language = language;
        this.text = text;
    }
}