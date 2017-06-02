import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

import logger from "../logger/index";
import { ValidatorFactory, ValidationResult } from "../validators/index";
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
    private _packagePath: string;

    /**
     * Typescript File(s) Analyser
     * @param packagePath Absolute package path
     * @param filePaths File paths to analyse
     */
    constructor(packagePath: string, filePaths: string[]) {
        this._filePaths = filePaths.map(path.normalize);
        this._packagePath = path.normalize(packagePath);

        this._program = ts.createProgram(filePaths, {
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.System,
            rootDir: process.cwd()
        });

        this._typeChecker = this._program.getTypeChecker();
    }

    private fileParse = (node: ts.Node): void => {

        // Each file should start with an export assignment.
        // When we find a node of that kind, it means we have a new file in our structure.
        // If the typescript file imports any other file, let's save that reference for later reuse.
        // After, we move to parse the remaining file nodes.

        switch (node.kind) {
            case ts.SyntaxKind.ExportAssignment:
                let tsSourceFile = node.getSourceFile();
                let file: File = new File(tsSourceFile.fileName, this._packagePath);

                // Add references
                for (let ref of (<any>tsSourceFile).imports) {
                    file.addOrUpdateReference(ref.parent.getText());
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

                            // When we find a PropertyAssignment node like
                            // #Comment
                            // 'propertyIdentifier: propertyInitializer'

                            let paNode = <ts.PropertyAssignment>node;
                            let messageDescription = null;

                            // Check if the property as any comment associated
                            let symbol = this._typeChecker.getSymbolAtLocation(paNode.name);
                            if (symbol != null) {
                                messageDescription = ts.displayPartsToString(symbol.getDocumentationComment());
                            }

                            // Find node bearing
                            // From one property to the next, we need to check if we are on the correct
                            // depth of our tree structure
                            for (let i = identifierPath.length - 1; i >= 0; i--) {
                                if (identifierPath[i].node === node.parent.parent) {
                                    break;
                                }

                                identifierPath.pop();
                            }

                            // Depending on the property initializer, we have to handle it differently
                            switch (paNode.initializer.kind) {
                                // If we have a string literal (ex: property1: "Property1Value")
                                // Or if we have a binary expression (ex: property1: i18nControls.LABEL + "abc")
                                // Or if we have a template expression (ex: property1: `This is a template string ${i18nControls.LABEL}`)
                                // We need to remove the first and last char, get the line and char position, and get the translation
                                case ts.SyntaxKind.StringLiteral:
                                case ts.SyntaxKind.BinaryExpression:
                                case ts.SyntaxKind.TemplateExpression:
                                {
                                    let nodeText = paNode.initializer.getText();
                                    nodeText = nodeText.slice(1, -1);

                                    let { line, character } = tsSourceFile.getLineAndCharacterOfPosition(paNode.initializer.getStart());

                                    let message = new Message(identifierPath.map((id) => id.name).concat([paNode.name.getText()]).join("."), messageDescription);
                                    message.addOrUpdateTranslation(new Translation(this._currentLanguage, nodeText, false, line, character));

                                    file.addOrUpdateMessage(message);
                                }
                                    break;
                                // If we have a property access (ex: property1: i18nControls.LABEL)
                                // We just use that value as the translation itself
                                case ts.SyntaxKind.Identifier:
                                case ts.SyntaxKind.PropertyAccessExpression:
                                {
                                    let nodeText = paNode.initializer.getText();

                                    let { line, character } = tsSourceFile.getLineAndCharacterOfPosition(paNode.initializer.getStart());

                                    let message = new Message(identifierPath.map((id) => id.name).concat([paNode.name.getText()]).join("."), messageDescription);
                                    message.addOrUpdateTranslation(new Translation(this._currentLanguage, nodeText, true, line, character));

                                    file.addOrUpdateMessage(message);
                                }
                                    break;
                                // If we have an object literal (ex: property1: {...})
                                // We create a new node on our tree, and move to parse the object
                                case ts.SyntaxKind.ObjectLiteralExpression:
                                    identifierPath.push({name: paNode.name.getText(), node: paNode});
                                    break;
                                // Else, we log a warning for future reference and continue
                                default:
                                    logger.warn("Unhandled property identifier", {
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

    /**
     * Run the typescript parser.
     * @returns A fully loaded package, describing all i18n files of the package.
     */
    public run(): Package {
        logger.info(`Starting Typescript parse`, {
            package: this._packagePath,
            paths: this._filePaths
        });

        this._files = [];

        for (const sourceFile of this._program.getSourceFiles()) {
            let sourceFilename = path.normalize(sourceFile.fileName);
            if (sourceFilename.indexOf("node_modules\\") < 0 && sourceFilename.indexOf(this._packagePath) >= 0) {
                let filename = path.basename(sourceFilename);
                let match = File.parseFileName(filename);

                this._fileName = match.name;
                this._currentLanguage = match.language === "default" ? Util.defaultLanguage : match.language;

                ts.forEachChild(sourceFile, this.fileParse);
            }
        }

        let pack: Package = new Package(this._packagePath);
        for (let file of this._files) {
            pack.addOrUpdateFile(file);
        }

        // Validate package
        let validationResults: ValidationResult[] = ValidatorFactory.validate(pack);
        validationResults.forEach((validationResult) => {
            logger.warn(validationResult.message, {
                file: validationResult.file.uniqueFileName,
                line: validationResult.line,
                col: validationResult.col
            });
        });

        return pack;
    }
}