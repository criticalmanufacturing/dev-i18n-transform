//#region Imports
import * as os from "os";
import { Util } from "../util";
import { Translation } from "../model/translation";
import logger from "../logger/index";
import * as fs from "fs";
import { IDataLocalizedMessages } from "../model/database";
import * as beautify from "js-beautify";
import { IConverteri18nMethods } from "./converter.interface";

const argv = require("minimist")(process.argv);

// Import config
let config: any;
if (argv["config"] === undefined || argv["config"] === null) {
  config = require("../i18n-import.config.json");
} else {
  config = require(argv["config"]);
}

//#endregion

export class StructuredQueryLanguageConverter implements IConverteri18nMethods {

    //#region Private Properties
    private _util: Util;
    //#endregion

    //#region Constructor

    constructor() {
        this._util = new Util();
    }

    //#endregion


    //#region Public Methods

    /**
     * Receiving a localized message, this method will find the file that will change and
     * insert the new localized message or replace the text if already exists.
     * Return the path of modified file
     * @param object (localized message)
     * @param key (package of config.packages.i18n)
     * @param originalFileName (OPTIONAL - name of file to be written)
     */
    public async writeToFile(object: IDataLocalizedMessages, key: string, originalFileName?: string) {
        try {
            let literal = {};
            let pack: string;
            let fileName: string;

            // Get text, culture and name of localized message
            let localizedMessageText = this.getLocalizedText(object);
            let cultureName = this.getCultureName(object);
            let localizedMessageName = this.getLocalizedName(object);

            if (originalFileName === undefined && key !== null) {
                fileName = this.getFileName(object);

                // "pack" equals to path in key on config.json
                pack = (<any>config.packages.i18n)[key].path;

                fileName = pack + "/" + fileName + "." + cultureName + ".ts";
                fileName = fileName.replace(/\\/gm, "/");
            }
            else {
                fileName = originalFileName;
            }


            if (localizedMessageText == null) {
                logger.warn(`Translation not found for ${object.localizedMessageName} (language: ${cultureName})`);
            }
            else if (localizedMessageText != null && typeof localizedMessageText === "string" && localizedMessageText.length > 0) {
                this._util.setNestedPropertyByArray(literal, localizedMessageName.split("."), localizedMessageText, true);
            }

            /**
             * Call private method "writeNewLocalizedMessageToFile"
             * @param data (data of file)
             * @param firstLocalizedMessageSection (first section in localized message name)
             * @param localizedMessageSections (sections in localized message name)
             * @param fileName (name of file)
             * @param localizedMessage (localized message)
             * @param localizedMessageName (name of localized message)
             * @param localizedMessageText (text of localized message)
             */
            let callWriteNewLocalizedMessageToFile = (
                data: string,
                firstLocalizedMessageSection: string,
                localizedMessageSections: string[],
                fileName: string,
                localizedMessage: string,
                localizedMessageName: string,
                localizedMessageText: string) => {
                this.writeNewLocalizedMessageToFile(
                    data,
                    firstLocalizedMessageSection,
                    localizedMessageSections,
                    fileName,
                    localizedMessage,
                    localizedMessageName,
                    localizedMessageText);
            };

            // Check if the file already exists
            if (fs.existsSync(fileName)) {
                let aux = localizedMessageName.split(".");
                let localizedMessage: string;
                let localizedMessageSections: string[];
                let firstLocalizedMessageSection: string;

                if (aux.length === 1) {
                    localizedMessage = aux[0];
                    firstLocalizedMessageSection = null;
                }
                else {
                    localizedMessageSections = localizedMessageName.split(".").slice(0, -1);
                    firstLocalizedMessageSection = localizedMessageSections[0];
                    localizedMessage = aux[aux.length - 1];
                }

                // Read file
                let content = await fs.readFileSync(fileName);
                let data = content.toString();

                // Check if the file contains "export default {"
                if (data.includes("export default {")) {
                    // If localized message already exists, locates it and replace its value
                    if (data.match(localizedMessage)) {
                        // Locates localized message
                        let regexMainString: string = "PARAMETER\:\ .*,*";
                        regexMainString = regexMainString.replace("PARAMETER", localizedMessage);
                        let replaceMessage: RegExp = new RegExp(regexMainString);

                        // Value to replace the localized message
                        let messageToReplace = localizedMessage + ": \"" + localizedMessageText + "\",";

                        let textToFile = data.replace(replaceMessage, messageToReplace);

                        fs.writeFileSync(fileName, Buffer.from(textToFile), { flag: "w" });
                    }
                    // If the localized message doesn't exist
                    else {
                        callWriteNewLocalizedMessageToFile(
                            data,
                            firstLocalizedMessageSection,
                            localizedMessageSections,
                            fileName,
                            localizedMessage,
                            localizedMessageName,
                            localizedMessageText);
                    }
                }
                // If file doesn't have "export default"
                else {
                    let outputText = `export default ${data};`;
                    outputText = beautify(outputText, {
                        indent_size: 4
                    });
                    outputText += os.EOL;
                    fs.writeFileSync(fileName, Buffer.from(outputText), { flag: "w" });
                }
            }
            // If the file doesn't exist
            else {
                let outputText = `export default ${this.stringifyTS(literal)};`;
                outputText = beautify(outputText, {
                    indent_size: 4
                });
                outputText += os.EOL;
                fs.writeFileSync(fileName, Buffer.from(outputText), { flag: "w+" });
            }
            return fileName;
        }
        catch (err) {
            console.log(err);
            return undefined;
        }
    }

    //#endregion

    //#region Private Methods

    /**
     * Write the new localized message to file
     * @param data (data of file)
     * @param firstLocalizedMessageSection (first section in localized message name)
     * @param localizedMessageSections (sections in localized message name)
     * @param fileName (name of file)
     * @param localizedMessage (localized message)
     * @param localizedMessageName (name of localized message)
     * @param localizedMessageText (text of localized message)
     */
    private async writeNewLocalizedMessageToFile(
        data: string,
        firstLocalizedMessageSection: string,
        localizedMessageSections: string[],
        fileName: string,
        localizedMessage: string,
        localizedMessageName: string,
        localizedMessageText: string) {

        try {

            let literal = {};

            if (localizedMessageText != null && typeof localizedMessageText === "string" && localizedMessageText.length > 0) {
                this._util.setNestedPropertyByArray(literal, localizedMessageName.split("."), localizedMessageText, true);
            }

            let ifLMDoesNotExist = () => {
                let output = this.stringifyTS(literal);
                output = beautify(output, {
                    indent_size: 4
                });
                return output;
            };

            let ifLMAndSectionDoesNotExist = (LM: string[]) => {
                let object = {};
                this._util.setNestedPropertyByArray(object, LM, localizedMessageText, true);
                let output = this.stringifyTS(object);
                output = beautify(output, {
                    indent_size: 4
                });
                return output;
            };

            // Checks if the first section of localized message is different than null and file already contains it
            if (data.match(firstLocalizedMessageSection) && firstLocalizedMessageSection != null) {
                // If the last section already exists, put the new localized message in first line after declaration of last section
                if (data.match(localizedMessageSections[localizedMessageSections.length - 1])) {
                    let regexMainString: string = "PARAMETER\:\ {";
                    regexMainString = regexMainString.replace("PARAMETER", localizedMessageSections[localizedMessageSections.length - 1]);
                    let regEx: RegExp = new RegExp(regexMainString);
                    let textToFile = localizedMessageSections[localizedMessageSections.length - 1] + ": {\n\t" + localizedMessage + ": \"" + localizedMessageText + "\",";
                    let text = beautify(data.replace(regEx, textToFile));
                    fs.writeFileSync(fileName, Buffer.from(text), { flag: "w" });
                }
                // Locates the last section where occurs the match
                else {
                    for (let index = localizedMessageSections.length - 2; index >= 0; index--) {
                        if (data.match(localizedMessageSections[index])) {
                            let regexMainString: string = "PARAMETER\:\ {";
                            regexMainString = regexMainString.replace("PARAMETER", localizedMessageSections[index]);
                            let regEx: RegExp = new RegExp(regexMainString);

                            // In "localizedMessageName", remove everything before last section matched
                            let regexString: string = ".*PARAMETER";
                            regexString = regexString.replace("PARAMETER", localizedMessageSections[index]);
                            let regExpression: RegExp = new RegExp(regexString);
                            let LMReplaced = localizedMessageName.replace(regExpression, "" + localizedMessageSections[index]);

                            let LM = LMReplaced.split(".");
                            let LMDoesNotExist = ifLMAndSectionDoesNotExist(LM);
                            LMDoesNotExist = LMDoesNotExist.slice(2, -3) + ",";
                            let text = beautify(data.replace(regEx, LMDoesNotExist));
                            fs.writeFileSync(fileName, Buffer.from(text), { flag: "w" });
                            break;
                        }
                    }
                }
            }
            // If data of file match "export default {}", replace "}"
            else if (data.match("export default {}")) {
                let regEx = new RegExp(/}.*/g);
                let textToFile = "\n\t" + ifLMDoesNotExist().slice(2, -1) + "};";
                let text = beautify(data.replace(regEx, textToFile));
                fs.writeFileSync(fileName, Buffer.from(text), { flag: "w" });
            }
            /*
             * If file looks like: "export default {"
             *                      }"
             */
            else if (data.match("export default {\r\n}")) {
                let regEx = "export default {\r\n}";
                let textToFile = "export default {\n\t" + ifLMDoesNotExist().slice(2, -1) + "}";
                let text = beautify(data.replace(regEx, textToFile));
                fs.writeFileSync(fileName, Buffer.from(text), { flag: "w" });
            }
            // Append in the end of file
            else {
                let regEx = new RegExp(/,\r*\n};*/g);
                if (data.match(regEx)) {
                    let textToFile = ",\n\t" + ifLMDoesNotExist().slice(2, -1) + "};";
                    let text = beautify(data.replace(regEx, textToFile));
                    fs.writeFileSync(fileName, Buffer.from(text), { flag: "w" });
                }
                else {
                    let regEx = new RegExp(/\r*\n};*/g);
                    let textToFile = ",\n\t" + ifLMDoesNotExist().slice(2, -1) + "};";
                    let text = beautify(data.replace(regEx, textToFile));
                    fs.writeFileSync(fileName, Buffer.from(text), { flag: "w" });
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    private isTemplateString(text: string): boolean {
        return text.indexOf("${") >= 0;
    }

    private stringifyTS(obj: any): string {

        let arrOfKeyVal: string[] = [],
            objKeys: string[] = [];

        // Handle leafs
        if (obj instanceof Translation) {
            if (obj.isLiteral === true) {
                return obj.text;
            } else {
                return this.isTemplateString(obj.text) ? `\`${obj.text}\`` : `"${obj.text}"`;
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
                let keyOut = `${key}`;
                let keyValOut: any = obj[key];

                // Skip functions and undefined properties
                if (keyValOut instanceof Function || typeof keyValOut === undefined) {
                    arrOfKeyVal.push("");
                } else if (typeof keyValOut === "string") {
                    keyValOut = this.isTemplateString(keyValOut) ? `\`${keyValOut}\`` : `"${keyValOut}"`;
                    arrOfKeyVal.push(`${keyOut}: ${keyValOut}`);
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
    }

    /**
     * Receiving a localized message, get the name of file to be changed
     * @param object (localized message)
     */
    private getFileName(object: IDataLocalizedMessages) {
        let fileName: string;
        if (object.localizedMessageName != null)
            fileName = object.localizedMessageName.split("#")[0];
        return fileName;
    }

    /**
     * Receiving a localized message, get the name of localized message
     * @param object (localized message)
     */
    private getLocalizedName(object: IDataLocalizedMessages) {
        let fileName: string;
        if (object.localizedMessageName != null)
            fileName = object.localizedMessageName.split("#")[1];
        return fileName;
    }

    /**
     * Receiving a localized message, get the name of culture
     * @param object (localized message)
     */
    private getCultureName(object: IDataLocalizedMessages) {
        let cultureName: string;
        if (object.cultureName != null)
            cultureName = object.cultureName;
        return cultureName;
    }

    /**
     * Receiving a localized message, get the text of localized message
     * @param object (localized message)
     */
    private getLocalizedText(object: IDataLocalizedMessages) {
        let localizedText: string;
        if (object.localizedMessageText != null)
            localizedText = object.localizedMessageText;
        return localizedText;
    }

    //#endregion
}