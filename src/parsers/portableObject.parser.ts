import { Parser } from "./parser.interface";
import { Package } from "../model/package";
import { File } from "../model/file";
import { Message } from "../model/message";
import logger from "../logger/index";

import * as fs from "fs";
import { Util } from "../util";
import { Translation, TranslatorNotes, TRANSLATOR_NOTES } from "../model/translation";

/**
 * PO (Portable Object) parser.
 * Parses a set of PO files into a {@see Package}
 */
export class PortableObjectParser implements Parser {
    /**
     * File paths to analyse
     */
    private _filePaths: string[];

    /**
     * Utility instance
     */
    private _util: Util = new Util();

    /**
     * Resulting package after parser is run.
     */
    private _package: Package;

    /**
     * PortableObject (PO) File(s) Analyser
     * @param packagePath Absolute package path
     * @param filePaths File paths to analyse
     */
    constructor(packagePath: string, filePaths: string[]) {
        this._filePaths = filePaths;
        this._package = new Package(packagePath);
    }

    private parseFile(filePath: string): void {
        // Read file into a string
        let data = fs.readFileSync(filePath, "utf-8");

        // Split the file content by empty new lines
        // The first entry is the PO Header
        let entries = this._util.splitByEmptyLine(data);

        if (entries != null && entries.length > 0) {
            let headerInfo = this.parseHeader(entries[0]);

            if (headerInfo.packageName !== this._package.name) {
                logger.warning(`The package '${this._package.name}' doesn't match the original package name saved on the header of '${filePath}'`);
            }

            // Remove the first element of the array
            entries.splice(0, 1);

            for (let entry of entries) {
                this.parseEntry(entry);
            }
        } else {
            // File contains no entries. Raise a warning
            logger.warning(`File '${filePath}' as no entries. Continuing...`);
        }
    }

    private parseEntry(entry: string): void {
        // Entry example:
        // #: test\mocks\multilevelExample\mock.pt-PT.ts#objects.WIZARD
        // msgid "Wizard"
        // msgstr "Wizard"

        let fileInfo = this.extractFileInformation(entry);
        let translationInfo = this.extractTranslation(entry);
        let notes = this.extractNotesForTranslators(entry);

        let message = new Message(fileInfo.objectPath);
        let translation = new Translation(fileInfo.details.language, translationInfo.value, notes.indexOf(TranslatorNotes.AutomaticTranslation) >= 0);
        message.addOrUpdateTranslation(translation);

        let file = new File(fileInfo.filePath);
        file.addOrUpdateMessage(message);

        // Add the file to the package
        this._package.addOrUpdateFile(file);
    }

    private extractFileInformation(info: string): {filePath: string, objectPath: string, details: any} {

        // Extract file information from row
        // #: test\mocks\multilevelExample\mock.pt-PT.ts#objects.WIZARD

        let filePathMatch = /#: (.+)/.exec(info);
        let path = filePathMatch[1];

        let fileAndObjectMatch = /(.*)#(.*)/.exec(path);
        let filePath = fileAndObjectMatch[1];
        let objectPath = fileAndObjectMatch[2];

        return {
            filePath: filePath,
            objectPath: objectPath,
            details: File.parseFileName(filePath)
        };
    }

    /**
     *
     * @param entry Translation entry to parse
     */
    private extractTranslation(entry: string): {value: string} {
        let translationMatch = /msgstr (.*)/.exec(entry);
        let translatedMessage = translationMatch[1];

        // Remove "" from the text
        translatedMessage = translatedMessage.slice(1, -1);

        return {
            value: translatedMessage
        };
    }

    /**
     * Extract translators notes from the translation entry.
     * Translation notes currently supported:
     * - 001 | Automated Translation
     *
     * @param entry Translation entry to extract the notes from
     * @return An array of translator notes.
     */
    private extractNotesForTranslators(entry: string): TranslatorNotes[] {
        let notes: TranslatorNotes[] = [];

        let match = /#\. (.+?)\s*\|\s*(.+)/gm.exec(entry);

        // Translator notes are not mandatory, so they may not exist
        if (match != null && match.length === 3) {
            let noteId = parseInt(match[1]);

            // Validate that this not exists
            if (!(noteId in TranslatorNotes)) {
                logger.warning(`Unknown translator note '${match[0]}'`);
            } else {
                notes.push(noteId);
            }
        }

        return notes;
    }

    /**
     * Parses the header of the PO file.
     *
     * @param header Header of the file to parse
     * @return Information about the package
     */
    private parseHeader(header: string): {packageName: string} {
        // Check if we have the package name on the file header
        let regexMatch = /[^]\# OriginalPackageName\: (.+)/.exec(header);

        return {
            packageName: regexMatch[1]
        };
    }

    public run(): Package {

        for (let path of this._filePaths) {
            this.parseFile(path);
        }

        return this._package;
    }
};