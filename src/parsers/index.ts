import * as path from "path";
import { TypescriptParser } from "./typescript.parser";
import { Parser } from "./parser.interface";
import { PortableObjectParser } from "./portableObject.parser";

export class ParserFactory {

    /**
     * Gets the right analyser for the specified language.
     *
     * @param packageName Package name
     * @param paths File paths to analyse
     * @param language Language to analyse
     */
    public static getParser(packageName: string, paths: string[], language?: string): Parser {
        let parser: Parser;

        // Check the first path to get the type of parsers needed
        if (!language) {
            if (paths != null && paths.length > 0) {
                language = path.extname(paths[0]);
            }
        }

        switch (language) {
            case ".ts":
                parser = new TypescriptParser(packageName, paths);
                break;
            case ".po":
            case ".pot":
                parser = new PortableObjectParser(packageName, paths);
                break;
            default:
                throw new Error("Not Implemented Yet");
        }

        return parser;
    }
}