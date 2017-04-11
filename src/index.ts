// ==================================================================
// = GetText <--> i18n tool for generating POT and reading PO files =
// ==================================================================
import * as path from "path";

import { ParserFactory } from "./parsers/index";

let parser = ParserFactory.getParser(
    [
        path.join(__dirname, "../test/mocks/simpleExample/mock.default.ts"),
        path.join(__dirname, "../test/mocks/simpleExample/mock.pt-PT.ts")
    ]
);
parser.run();