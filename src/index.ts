// ==================================================================
// = GetText <--> i18n tool for generating POT and reading PO files =
// ==================================================================
import * as path from "path";
import * as fs from "fs";

import { ParserFactory } from "./parsers/index";
import { Package } from "./model/package";
import { WriterFactory } from "./writers/index";

let parser = ParserFactory.getParser("test",
    [
        path.join(__dirname, "../test/mocks/multilevelExample/mock.default.ts"),
        path.join(__dirname, "../test/mocks/multilevelExample/mock.pt-PT.ts")
    ]
);
let pack = parser.run();

let writer = WriterFactory.getWriter(pack, "pt-PT");
let buffer = writer.run();
let result = buffer.toString("utf-8");

fs.writeFile("C:\\Temp\\i18n.po", buffer, () => {
    console.log("File written to the disk!");
    process.exit(0);
});

// console.dir(pack);
