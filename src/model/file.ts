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

    /**
     * File model constructor
     * @param filename Path to the file to create
     * @param packagePath Path of the package where the file is in
     */
    constructor(filename: string, packagePath?: string) {

        let match = File.parseFileName(filename, packagePath);
        this._filename = match.name;
        this._extension = match.extension;
        this._dirname = match.path;
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
     * Add or updates a reference to the current file
     * @param reference Reference to add
     */
    public addOrUpdateReference(reference: string): void {
        // If a reference already exists, skip
        if (this.references.indexOf(reference) === -1) {
            this.references.push(reference);
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
        // Checks if the argument 'file' is null
        if (!file) {
            throw new Error("Argument 'file' cannot be null");
        }

        for (let id in file._messages) {
            this.addOrUpdateMessage(file._messages[id]);
        }

        if (Array.isArray(file.references)) {
            for (let reference of file.references) {
                this.addOrUpdateReference(reference);
            }
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
     * Parses the given filename into a easy to handle structure
     * @param filename Filename to parse
     * @return Decomposed file name
     */
    public static parseFileName(filename: string, packagePath?: string): {name: string, language: string, extension: string, path: string} {
        // Check if the filename is undefined
        if (!filename) {
            throw new Error("Argument 'filename' cannot be undefined");
        }

        let match = /(.+)\.(.+?)\.(\w+)/.exec(path.basename(filename));

        // See if the array 'match' is null
        if (match == null) {
            throw new Error(`Filename '${filename}' doesn't match the correct format`);
        }

        // If package name is defined, use relative path
        let filePath: string = packagePath != null ? path.relative(packagePath, filename) : filename;

        // Return the name, language, extension and path of file according with array 'match'
        return {
            name: match[1],
            language: match[2],
            extension: match[3],
            path: path.dirname(filePath)
        };
    }
}