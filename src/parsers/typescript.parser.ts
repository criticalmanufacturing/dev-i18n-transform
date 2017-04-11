import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

import logger from "../logger/index";
import { File } from "../model/file";
import { Message } from "../model/message";
import { Parser } from "./parser.interface";
import { Translation } from "../model/translation";

export class TypescriptParser implements Parser {

    /**
     * File paths to analyse
     */
    private _filePaths: string[];

    /**
     * Typescript Type Checker
     */
    private _typeChecker: ts.TypeChecker;

    /**
     * Typescript program reference
     */
    private _program: ts.Program;

    /**
     * Typescript messages
     */
    private _messages: Message[] = [];

    /**
     * Stores the current language
     */
    private _currentLanguage: string;

    /**
     * Current filename
     */
    private _fileName: string;

    /**
     * Files parsed
     */
    private _files: File[];

    /**
     * Typescript File(s) Analyser
     * @param filePaths File paths to analyse
     */
    constructor(filePaths: string[]) {
        this._filePaths = filePaths;

        this._program = ts.createProgram(filePaths, {
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.System
        });

        this._typeChecker = this._program.getTypeChecker();
    }

    private fileParse = (node: ts.Node): void => {

        switch (node.kind) {
            case ts.SyntaxKind.ExportAssignment:
                let file: File = new File(node.getSourceFile().fileName);
                let messageId: string[] = [];

                let nodeParser = (node: ts.Node): void => {

                    logger.info("node", {
                        kind: ts.SyntaxKind[node.kind],
                        text: node.getFullText(),
                        name: (<any>node).name
                    });

                    switch (node.kind) {
                        case ts.SyntaxKind.Identifier:
                            let identifier = <ts.Identifier>node;
                            messageId.push(identifier.getText());

                            break;
                        case ts.SyntaxKind.StringLiteral:

                            let nodeText = node.getText();
                            nodeText = nodeText.slice(1, -1);

                            let message = new Message(messageId.join("."));
                            message.addOrUpdateTranslation(new Translation(this._currentLanguage, nodeText));

                            file.addOrUpdateMessage(message);

                            messageId.pop();

                            break;
                        default:
                            break;
                    }


                    ts.forEachChild(node, nodeParser);
                };

            nodeParser(node);
            this._files.push(file);
            break;
        }
    }

    public run(): File[] {
        logger.info(`Starting Typescript parse`, {
            paths: this._filePaths
        });

        this._files = [];

        for (const sourceFile of this._program.getSourceFiles()) {
            if (sourceFile.fileName.indexOf("node_modules/") < 0) {
                let filename = path.basename(sourceFile.fileName);
                let match = File.parseFileName(filename);

                this._fileName = match.name;
                this._currentLanguage = match.language === "default" ? "en-US" : match.language;

                ts.forEachChild(sourceFile, this.fileParse);
            }
        }

        return this._files;
    }
}