
import { Translation } from "./translation";

export class Message {

    /**
     * Gets the Message Id
     */
    public readonly id: string;

    /**
     * Gets the Description
     */
    public readonly description: string;

    /**
     * Message translations
     */
    private readonly _translations: {[code: string]: Translation};

    /**
     * Message constructor
     *
     * @param id Message id
     * @param description Message description
     */
    constructor(id: string, description?: string) {
        this.id = id;
        this.description = description;
        this._translations = {};
    }

    /**
     * Add or update a translation to the message
     *
     * @param translation Translation to add (or update) to the message
     */
    addOrUpdateTranslation(translation: Translation): void {

        if (!translation) {
            throw new Error("Argument 'translation' cannot be null");
        }

        this._translations[translation.language] = translation;
    }

    /**
     * Check if the given translation exists
     * @param code Language code
     * @return True if the translation exists, false otherwise
     */
    hasTranslation(code: string): boolean {
        return code in this._translations;
    }

    /**
     * Gets the translation for the given code
     *
     * @param code Language code
     * @returns {@see Translation} if exists, null otherwise
     */
    getTranslation(code: string): Translation {
        if (this.hasTranslation(code)) {
            return this._translations[code];
        }

        return null;
    }

    /**
     * Merge the given message into the current.
     * Adds or updates the base translations with the new ones.
     *
     * @param message Message to merge
     */
    merge(message: Message): void {

        if (!message) {
            throw new Error("Argument 'message' cannot be null");
        }

        for (let code in message._translations) {
            this.addOrUpdateTranslation(message.getTranslation(code));
        }
    }
}