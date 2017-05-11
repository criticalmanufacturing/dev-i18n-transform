import * as os from "os";
import { Writer, FileOutputInformation } from "./writer.interface";
import { Package } from "../model/package";
import { File } from "../model/file";
import { Util } from "../util";
import { Translation } from "../model/translation";

import * as beautify from "js-beautify";

export class TypescriptWriter implements Writer {

    private _package: Package;
    private _language: string;
    private _util: Util;

    constructor(pack: Package, language: string) {
        this._package = pack;
        this._language = language;
        this._util = new Util();
    }

    private writeFile(file: File): FileOutputInformation {
        let fileName = file.translatedFileName(this._language);

        // Join the references in the header
        // Ex: import i18nControls from "cmf.core.controls/src/i18n/main.default";
        let referenceBuffer: Buffer = null;
        if (Array.isArray(file.references) && file.references.length > 0) {
            referenceBuffer = new Buffer(file.references.join(os.EOL) + os.EOL + os.EOL);
        } else {
            referenceBuffer = new Buffer("");
        }

        // Build the object to print. If literal don't use ""

        let literal = {};

        file.messages.map((msg) => {
            let translation = msg.getTranslation(this._language);
            this._util.setNestedPropertyByArray(literal, msg.id.split("."), translation, true);
        });

        let outputText = `export default ${this.stringifyTS(literal)};`;
        outputText = beautify(outputText, {
            indent_size: 4
        });

        return {
            file: fileName,
            content: Buffer.concat([referenceBuffer, new Buffer(outputText)])
        };
    }

    private stringifyTS(obj: any): string {

        let arrOfKeyVal: string[] = [],
            objKeys: string[] = [];

        // Handle leafs
        if (obj instanceof Translation) {
            if (obj.isLiteral === true) {
                return obj.text;
            } else {
                return `"${obj.text}"`;
            }
        }

        /*********CHECK FOR ARRAY**********/
        else if (Array.isArray(obj)) {
            // Check for empty array
            if (obj.length === 0)
                return "[]";
            else {
                let arrVal: string[] = [];
                obj.forEach((el) => {
                    arrVal.push(this.stringifyTS(el));
                });

                return `[${arrVal}]`;
            }
        }
        /*********CHECK FOR OBJECT**********/
        else if (obj instanceof Object) {
            // Get object keys
            objKeys = Object.keys(obj);

            // Set key output;
            objKeys.forEach((key) => {
                let keyOut = `"${key}"`;
                let keyValOut: any = obj[key];

                // Skip functions and undefined properties
                if (keyValOut instanceof Function || typeof keyValOut === undefined) {
                    arrOfKeyVal.push("");
                } else if (typeof keyValOut === "string") {
                    arrOfKeyVal.push(`${keyOut}: "${keyValOut}"`);
                } else if (typeof keyValOut === "boolean" || typeof keyValOut === "number" || keyValOut === null) {
                    arrOfKeyVal.push(`${keyOut}: ${keyValOut}`);
                // Check for nested objects, call recursively until no more objects
                } else if (keyValOut instanceof Object) {
                    arrOfKeyVal.push(`${keyOut}: ${this.stringifyTS(keyValOut)}`);
                }
            });
            return `{${arrOfKeyVal}}`;
        }

        throw new Error("Not Implemented");
    };


    public run(): FileOutputInformation[] {

        // A package may have multiple files (most of the times it does)
        // So, we need to run through all files and, for each, create a correspondent
        // Typescript file

        return this._package.files.map((file) => {
            return this.writeFile(file);
        });
    }
}