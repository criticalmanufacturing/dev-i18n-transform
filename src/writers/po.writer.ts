import * as os from "os";

import { File } from "../model/file";
import { Writer } from "./writer.interface";
import { Message } from "../model/message";
import Util from "../util";
import { Package } from "../model/package";

const projectInfo = Util.getProjectInformation();

export class PoWriter implements Writer {

    private _package: Package;
    private _language: string;

    private _fileHeader: string;

    constructor(pack: Package, language: string) {
        this._package = pack;
        this._language = language;

        this._fileHeader = `
msgid ""
msgstr ""
"Project-Id-Version: ${projectInfo.name} ${projectInfo.version} \\n"
"Report-Msgid-Bugs-To: support@criticalmanufacturing.com \\n"
"Last-Translator: ${projectInfo.name} <info@criticalmanufacturing.com> \\n"
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

        // Reference to original source file
        result.push(`#: ${currentFile.translatedFileName(this._language)}`);
        result.push(`#| msgid ${message.id}`);
        // If there is a comment on the resource, insert it as msg context
        if (message.description) {
            result.push(`msgctxt "${message.description}"`);
        }

        // Message id
        result.push(`msgid "${message.getTranslation(Util.defaultLanguage).text}"`);

        let translation = message.getTranslation(this._language);
        let translationText = "";

        if (translation != null) {
            translationText = translation.text;
        }

        result.push(`msgstr "${translationText}"`);

        return new Buffer(result.join(os.EOL));
    }

    /**
     * Writes a modal file into a Buffer in the PO format
     * @param file File to analyse and generate the PO
     */
    private writeFile(file: File): Buffer {
        let eolBuffer = new Buffer(os.EOL);

        let buffers = file.messages.filter((message) => message.hasTranslation(Util.defaultLanguage)).map((message) => {
            return Buffer.concat([this.writeMessage(file, message), eolBuffer, eolBuffer]);
        });

        return Buffer.concat(buffers);
    }

    /**
     * Run the writer
     * @returns Buffer containing the file content
     */
    public run(): Buffer {

        let fileHeaderBuffer = new Buffer(this._fileHeader);

        let buffers = this._package.files.map((file) => {
            return this.writeFile(file);
        });

        return Buffer.concat([fileHeaderBuffer].concat(buffers));
    }
}