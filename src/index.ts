// ==================================================================
// = GetText <--> i18n tool for generating POT and reading PO files =
// ==================================================================

//#region Imports
import * as gulp from "./gulp";
import { ParserFactory } from "./parsers/index";
import { WriterFactory } from "./writers/index";
//#endregion

module.exports = {
    parser: ParserFactory,
    writer: WriterFactory,
    gulp: gulp
};
