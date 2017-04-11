// ==================================================================
// = GetText <--> i18n tool for generating POT and reading PO files =
// ==================================================================
import * as path from "path";
import * as fs from "fs";

import { ParserFactory } from "./parsers/index";
import { Package } from "./model/package";
import { WriterFactory } from "./writers/index";

let parser = ParserFactory.getParser(
    [
        path.join(__dirname, "../test/mocks/simpleExample/mock.default.ts"),
        path.join(__dirname, "../test/mocks/simpleExample/mock.pt-PT.ts")
    ]
);
let files = parser.run();

let pack: Package = new Package("test");
for (let file of files) {
    pack.addOrUpdateFile(file);
}

let writer = WriterFactory.getWriter(pack.files, "en-US");
let buffer = writer.run();
let result = buffer.toString("utf-8");

fs.writeFile("C:\\Temp\\i18n.po", buffer, () => {
    console.log("File written to the disk!");
    process.exit(0);
});

// console.dir(pack);
