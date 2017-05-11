
import { Writer } from "./writer.interface";
import { PoWriter } from "./po.writer";
import { Package } from "../model/package";
import { TypescriptWriter } from "./typescript.writer";

/**
 * Writer Factory
 *
 * Provides an instance of a {@see Writer}.
 */
export class WriterFactory {
    /**
     * Gets the correct writer for the specified language
     *
     * @param pack Package to write
     * @param language Language to write to
     * @returns An instance of a writer for the specified language
     */
    public static getWriter(pack: Package, outputLanguage: string, language: "pot" | "ts" = "pot"): Writer {
        let writer: Writer;

        switch (language) {
            case "pot":
                writer = new PoWriter(pack, outputLanguage);
                break;
            case "ts":
                writer = new TypescriptWriter(pack, outputLanguage);
                break;
            default:
                throw new Error("Not Implemented Yet");
        }

        return writer;
    }
}