import { Parser } from "./parser.interface";
import { Package } from "../model/package";
import { File } from "../model/file";
import { Message } from "../model/message";
import logger from "../logger/index";

import * as fs from "fs";
import { Util } from "../util";

export class PortableObjectParser implements Parser {
    /**
     * File paths to analyse
     */
    private _filePaths: string[];

    /**
     * Package name
     */
    private _packagePath: string;

    /**
     * Utility instance
     */
    private _util: Util = new Util();

    /**
     * PortableObject (PO) File(s) Analyser
     * @param packagePath Absolute package path
     * @param filePaths File paths to analyse
     */
    constructor(packagePath: string, filePaths: string[]) {
        this._filePaths = filePaths;
        this._packagePath = packagePath;
    }

    private parseFile(filePath: string): File {
        let data = fs.readFileSync(filePath, "utf-8");
        this._util.splitByEmptyLine(data);

        throw new Error("Not Implemented");
    }

    private parseEntry(entry: string): Message {
        throw new Error("Not Implemented");
    }

    public run(): Package {
        let pack = new Package(this._packagePath);

        for (let path of this._filePaths) {
            pack.addOrUpdateFile(this.parseFile(path));
        }

        return pack;
    }
};