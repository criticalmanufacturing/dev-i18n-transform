import { TypescriptParser } from "./typescript.parser";
import { Parser } from "./parser.interface";

export class ParserFactory {

    /**
     * Gets the right analyser for the specified language.
     *
     * @param paths File paths to analyse
     * @param language Language to analyse
     */
    public static getParser(paths: string[], language: "ts" = "ts"): Parser {
        let parser: Parser;

        switch (language) {
            case "ts":
                parser = new TypescriptParser(paths);
                break;
            default:
                throw new Error("Not Implemented Yet");
        }

        return parser;
    }
}