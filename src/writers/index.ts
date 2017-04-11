import { File } from "../model/file";
import { Writer } from "./writer.interface";
import { PoWriter } from "./po.writer";


export class WriterFactory {
    public static getWriter(files: File[], outputLanguage: string, language: "pot" = "pot"): Writer {
        let writer: Writer;

        switch (language) {
            case "pot":
                writer = new PoWriter(files, outputLanguage);
                break;
            default:
                throw new Error("Not Implemented Yet");
        }

        return writer;
    }
}