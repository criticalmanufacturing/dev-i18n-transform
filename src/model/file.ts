import * as path from "path";
import { Message } from "./message";

export class File {

    private _dirname: string;
    private _filename: string;
    private _extension: string;

    private readonly _messages: {[key: string]: Message} = {};

    /**
     * Gets the list of file references
     */
    public readonly references: string[] = [];

    /**
     * Gets the file name
     */
    public get uniqueFileName(): string {
        return path.join(this._dirname, `${this._filename}.${this._extension}`);
    }

    /**
     * Gets all file messages
     */
    public get messages(): Message[] {
        return Object.keys(this._messages).map((index) => {
            return this._messages[index];
        });
    }

    constructor(filename: string) {

        let match = File.parseFileName(filename);
        this._filename = match.name;
        this._extension = match.extension;
        this._dirname = path.dirname(filename);
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

    /**
     * Gets a given message from the file
     * @param id Message id
     * @returns Null if id doesn't exist, the Message otherwise
     */
    public getMessage(id: string): Message {
        return this._messages[id] || null;
    }

    /**
     * Merges the given file into the current
     * @param file File to merge
     * @throws Argument null error if file is not defined
     */
    public merge(file: File): void {

        if (!file) {
            throw new Error("Argument 'file' cannot be null");
        }

        for (let id in file._messages) {
            this.addOrUpdateMessage(file._messages[id]);
        }

    }

    /**
     * Gets the translated file name
     * @param language Language code of the file
     */
    public translatedFileName(language: string): string {
        return path.join(this._dirname, `${this._filename}.${language}.${this._extension}`);
    }

    /**
     * Add a reference to the current file
     * @param ref Reference to add
     */
    public addReference(ref: string): void {
        this.references.push(ref);
    }

    /**
     * Parses the given filename into a easy to handle structure
     * @param filename Filename to parse
     * @return Decomposed file name
     */
    public static parseFileName(filename: string): {name: string, language: string, extension: string} {

        if (!filename) {
            throw new Error("Argument 'filename' cannot be undefined");
        }

        let match = /(.+)\.(.+?)\.(\w+)/.exec(path.basename(filename));

        if (match == null) {
            throw new Error(`Filename '${filename}' doesn't match the correct format`);
        }

        return {
            name: match[1],
            language: match[2],
            extension: match[3]
        };
    }
}