import * as os from "os";

import { File } from "../model/file";
import { Writer, FileOutputInformation } from "./writer.interface";
import { Message } from "../model/message";
import Util from "../util";
import { Package } from "../model/package";
import { TranslatorNotes, TRANSLATOR_NOTES} from "../model/translation";

const projectInfo = Util.getProjectInformation();

export class PoWriter implements Writer {

    private _package: Package;
    private _language: string;

    private _fileHeader: string;

    constructor(pack: Package, language: string) {
        this._package = pack;
        this._language = language;

        this._fileHeader = `# Critical Manufacturing Translation File
# Copyright (C) ${new Date().getFullYear()} Critical Manufacturing S.A.
# This file is distributed under the GPL 3.0 License
# For more information contact@criticalmanufacturing.com
# OriginalPackageName: ${pack.name}
#
msgid ""
msgstr ""
"Project-Id-Version: ${projectInfo.name} ${projectInfo.version} \\n"
"Report-Msgid-Bugs-To: support@criticalmanufacturing.com \\n"
"Language-Team: ${projectInfo.name} <info@criticalmanufacturing.com> \\n"
"Language: ${this._language} \\n"
"MIME-Version: 1.0 \\n"
"Content-Type: text/plain; charset=UTF-8\\n"
\n`;
    }

    private writeMessage(currentFile: File, message: Message): Buffer {
        let result = [];

        /**
         * #: modules/content_multiGroup/aef_image_field.inc:9
         * msgid "UberImage"
         * msgstr ""
         * msgctxt context
         */
        let defaultMessage = message.getTranslation(Util.defaultLanguage);
        let translatedMessage = message.getTranslation(this._language);

        // If the translated message is empty or null, try to locate the same message in other files
        if (!translatedMessage || !translatedMessage.text) {
            loop:
            // Iterate all other files in this package
            for (const externalFile of this._package.files) {
                // In each package, iterate all messages
                for (const externalMessage of externalFile.messages) {
                    // Skip itself
                    if (externalFile.uniqueFileName !== currentFile.uniqueFileName || externalMessage.id !== message.id) {
                        // Get the translation and check if this is the same
                        const externalDefaultMessage = externalMessage.getTranslation(Util.defaultLanguage);
                        if (externalDefaultMessage && externalDefaultMessage.text === defaultMessage.text) {
                            // The default text is the same, so now try to get its translation also
                            const externalTranslatedMessage = externalMessage.getTranslation(this._language);
                            if (externalTranslatedMessage) {
                                translatedMessage = externalTranslatedMessage;
                                break loop;
                            }
                        }
                    }
                }
            }
        }

        // Reference to original source file
        result.push(`#: ${currentFile.translatedFileName(this._language)}#${message.id}`);

        // Get translated text
        // If the default message is a literal, and there is no translation on the target language
        // let's assume that the default translation will be the same as the target
        let translatedText: string = "";
        if (defaultMessage.isLiteral === true && translatedMessage === null) {
            translatedText = defaultMessage.text;
            // Save notes
            result.push(`#. ${TRANSLATOR_NOTES[TranslatorNotes.AutomaticTranslation]}`);
        } else if (translatedMessage !== null && translatedMessage.isLiteral === true) {
            translatedText = translatedMessage.text;
            result.push(`#. ${TRANSLATOR_NOTES[TranslatorNotes.AutomaticTranslation]}`);
        } else if (translatedMessage !== null) {
            translatedText = translatedMessage.text;
        }

        // If there is a comment on the resource, insert it as msg context
        if (message.description) {
            result.push(`msgctxt "${message.description}"`);
        }

        // Message id
        result.push(`msgid "${defaultMessage.text}"`);
        result.push(`msgstr "${translatedText}"`);

        return new Buffer(result.join(os.EOL));
    }

    /**
     * Writes a modal file into a Buffer in the PO format
     * @param file File to analyse and generate the PO
     */
    private writeFile(file: File): Buffer {
        let eolBuffer = new Buffer(os.EOL);

        // Create Message Buffers
        let buffers = file.messages.filter((message) => message.hasTranslation(Util.defaultLanguage)).map((message) => {
            return Buffer.concat([this.writeMessage(file, message), eolBuffer, eolBuffer]);
        });

        // Handle references
        let referenceBuffers: Buffer[] = null;
        if (file.references != null && file.references.length > 0) {
            referenceBuffers = file.references.map((ref) => {
                return Buffer.concat([new Buffer(`# AddReference | ${ref} | ${file.translatedFileName(this._language)}`), eolBuffer]);
            });
        }

        if (referenceBuffers != null) {
            buffers = [...referenceBuffers, ...buffers];
        }

        return Buffer.concat(buffers);
    }

    /**
     * Run the writer
     * @returns Buffer containing the file content
     */
    public run(): FileOutputInformation[] {

        let fileHeaderBuffer = new Buffer(this._fileHeader);

        let buffers = this._package.files.map((file) => {
            return this.writeFile(file);
        });

        return [{
            file: `${this._package.name}.${this._language}.po`,
            content: Buffer.concat([fileHeaderBuffer].concat(buffers))
        }];
    }
}