import * as util from "gulp-util";
import * as through from "through2";
import * as path from "path";
import * as File from "vinyl";

import {ParserFactory} from "./parsers/index";
import {WriterFactory} from "./writers/index";

export interface Options {
    base: string;
    languages: string[];
    dest: "pot" | "po" | "ts";
}

module.exports = function (options: Options) {

    options.languages = options.languages || [];

    let files: string[] = [];

    function processFiles(file: File, encoding: any, callback: Function) {
        // ignore empty files
        if (file.isNull()) {
            return callback();
        }

        files.push(file.path);
        callback();
    }

    function executeConversion(callback: Function) {
        if (files.length === 0) {
            return callback();
        }

        // Get the parser
        let parser = ParserFactory.getParser(options.base || process.cwd(), files);

        // Run the parser and get all files for this package
        let pack = parser.run();

        // For each language, generate output files
        options.languages.forEach((language) => {
            let writer = WriterFactory.getWriter(pack, language, options.dest);
            let buffer = writer.run();

            for (let i = 0; i < buffer.length; i++) {
                let file = new File();
                file.path = buffer[i].file;
                file.contents = buffer[i].content;
                this.push(file);
            }
        });

        callback();
    }

    return through.obj(processFiles, executeConversion);
};