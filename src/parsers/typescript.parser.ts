import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

import logger from "../logger/index";
import { File } from "../model/file";
import { Message } from "../model/message";
import { Parser } from "./parser.interface";
import { Translation } from "../model/translation";
import { Package } from "../model/package";
import Util from "../util";

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
     * Package name
     */
    private _packageName: string;

    /**
     * Typescript File(s) Analyser
     * @param filePaths File paths to analyse
     */
    constructor(packageName: string, filePaths: string[]) {
        this._filePaths = filePaths;
        this._packageName = packageName;

        this._program = ts.createProgram(filePaths, {
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.System
        });

        this._typeChecker = this._program.getTypeChecker();
    }

    private fileParse = (node: ts.Node): void => {

        switch (node.kind) {
            case ts.SyntaxKind.ExportAssignment:
                let tsSourceFile = node.getSourceFile();
                let file: File = new File(tsSourceFile.fileName);

                // Add references
                for (let ref of (<any>tsSourceFile).imports) {
                    file.addReference(ref.parent.getText());
                }

                let identifierPath: {name: string, node: ts.Node}[] = [];

                let nodeParser = (node: ts.Node): void => {

                    logger.info("node", {
                        kind: ts.SyntaxKind[node.kind],
                        text: node.getFullText(),
                        name: (<any>node).name
                    });

                    switch (node.kind) {
                        case ts.SyntaxKind.Identifier:
                            break;
                        case ts.SyntaxKind.StringLiteral:
                            break;
                        case ts.SyntaxKind.PropertyAssignment:

                            let paNode = <ts.PropertyAssignment>node;
                            let messageDescription = null;

                            let symbol = this._typeChecker.getSymbolAtLocation(paNode.name);
                            if (symbol != null) {
                                messageDescription = ts.displayPartsToString(symbol.getDocumentationComment());
                            }

                            // Find node bearing
                            for (let i = identifierPath.length - 1; i >= 0; i--) {
                                if (identifierPath[i].node === node.parent.parent) {
                                    break;
                                }

                                identifierPath.pop();
                            }

                            switch (paNode.initializer.kind) {
                                case ts.SyntaxKind.StringLiteral:
                                case ts.SyntaxKind.BinaryExpression:
                                case ts.SyntaxKind.TemplateExpression:
                                {
                                    let nodeText = paNode.initializer.getText();
                                    nodeText = nodeText.slice(1, -1);

                                    let message = new Message(identifierPath.map((id) => id.name).concat([paNode.name.getText()]).join("."), messageDescription);
                                    message.addOrUpdateTranslation(new Translation(this._currentLanguage, nodeText));

                                    file.addOrUpdateMessage(message);
                                }
                                    break;
                                case ts.SyntaxKind.PropertyAccessExpression:
                                {
                                    let nodeText = paNode.initializer.getText();

                                    let message = new Message(identifierPath.map((id) => id.name).concat([paNode.name.getText()]).join("."), messageDescription);
                                    message.addOrUpdateTranslation(new Translation(this._currentLanguage, nodeText, true));

                                    file.addOrUpdateMessage(message);
                                }
                                    break;
                                case ts.SyntaxKind.ObjectLiteralExpression:
                                    identifierPath.push({name: paNode.name.getText(), node: paNode});
                                    break;
                                default:
                                    logger.warning("Unhandled property identifier", {
                                        kind: ts.SyntaxKind[paNode.initializer.kind],
                                        node: paNode
                                    });
                                    break;
                            }

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

    public run(): Package {
        logger.info(`Starting Typescript parse`, {
            paths: this._filePaths
        });

        this._files = [];

        for (const sourceFile of this._program.getSourceFiles()) {
            if (sourceFile.fileName.indexOf("node_modules/") < 0) {
                let filename = path.basename(sourceFile.fileName);
                let match = File.parseFileName(filename);

                this._fileName = match.name;
                this._currentLanguage = match.language === "default" ? Util.defaultLanguage : match.language;

                ts.forEachChild(sourceFile, this.fileParse);
            }
        }

        let pack: Package = new Package(this._packageName);
        for (let file of this._files) {
            pack.addOrUpdateFile(file);
        }

        return pack;
    }
}