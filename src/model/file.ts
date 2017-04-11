import { Message } from "./message";

export class File {

    public filename: string;

    private readonly _messages: {[key: string]: Message} = {};

    constructor(filename: string) {
        this.filename = filename;
    }

    /**
     * Adds or updates a message to the current file
     *
     * @param message The message to be added
     */
    public addOrUpdateMessage(message: Message): void {
        // If message already exists, merge the translations
        if (message.id in this._messages) {
            this._messages[message.id].merge(message);
        } else {
            this._messages[message.id] = message;
        }
    }
}