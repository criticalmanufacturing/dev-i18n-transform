
import { Writer } from "./writer.interface";
import { PoWriter } from "./po.writer";
import { Package } from "../model/package";


export class WriterFactory {
    public static getWriter(pack: Package, outputLanguage: string, language: "pot" = "pot"): Writer {
        let writer: Writer;

        switch (language) {
            case "pot":
                writer = new PoWriter(pack, outputLanguage);
                break;
            default:
                throw new Error("Not Implemented Yet");
        }

        return writer;
    }
}