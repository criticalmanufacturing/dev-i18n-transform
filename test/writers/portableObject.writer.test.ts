import * as chai from "chai";
import * as path from "path";
import { Package } from "../../src/model/package";
import { TypescriptParser } from "../../src/parsers/typescript.parser";
import { PoWriter } from "../../src/writers/po.writer";

let chaiString = require("chai-string");
chai.use(chaiString);

describe("Portable Object writer", () => {

    it("should parse duplicatedTextWithoutTranslationExample", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/duplicatedTextWithoutTranslationExample/mock1.default.ts"),
            path.join(__dirname, "../mocks/duplicatedTextWithoutTranslationExample/mock1.pt-PT.ts"),
            path.join(__dirname, "../mocks/duplicatedTextWithoutTranslationExample/mock2.default.ts"),
            path.join(__dirname, "../mocks/duplicatedTextWithoutTranslationExample/mock2.pt-PT.ts")
        ];

        let ts = new TypescriptParser("test", mocksPaths);
        let pack = ts.run();

        chai.expect(pack.files).to.have.length(2);

        let po = new PoWriter(pack, "pt-PT");
        let output = po.run();

        chai.expect(output).to.exist;
        chai.expect(output).to.have.length(1);

        const expectedResult = `
        # Critical Manufacturing Translation File
        # Copyright (C) 2017 Critical Manufacturing S.A.
        # This file is distributed under the GPL 3.0 License
        # For more information contact@criticalmanufacturing.com
        # OriginalPackageName: test
        # 
        msgid ""
        msgstr ""
        "Project-Id-Version: @criticalmanufacturing/dev-i18n-transform _ \\n"
        "Report-Msgid-Bugs-To: support@criticalmanufacturing.com \\n"
        "Language-Team: @criticalmanufacturing/dev-i18n-transform <info@criticalmanufacturing.com> \\n"
        "Language: pt-PT \\n"
        "MIME-Version: 1.0 \\n"
        "Content-Type: text/plain; charset=UTF-8\\n"

        #: mocks${path.sep}duplicatedTextWithoutTranslationExample${path.sep}mock1.pt-PT.ts#TEXT
        msgid "MyText"
        msgstr "My translated text"

        #: mocks${path.sep}duplicatedTextWithoutTranslationExample${path.sep}mock1.pt-PT.ts#TEXT_DUPLICATED
        msgid "MyText"
        msgstr "My translated text"

        #: mocks${path.sep}duplicatedTextWithoutTranslationExample${path.sep}mock2.pt-PT.ts#TEXT
        msgid "MyText"
        msgstr "My translated text"
        `;

        let outputResult: string = output[0].content.toString();
        outputResult = outputResult.replace(/(@criticalmanufacturing\/dev-i18n-transform) (\S+)/, "$1 _");

        chai.expect(outputResult).to.equalIgnoreSpaces(expectedResult);
    });

});