import * as chai from "chai";
import { Util } from "../src/util";

describe("Utilities test", () => {
    let util = new Util();

    it("should split a string by empty lines", () => {
        let stringToSplit = `# Critical Manufacturing Translation File
# Copyright (C) 2017 Critical Manufacturing S.A.
# This file is distributed under the GPL 3.0 License
# For more information contact@criticalmanufacturing.com
#
msgid ""
msgstr ""
"Project-Id-Version: cmf.dev.i18n 0.0.1 \n"
"Report-Msgid-Bugs-To: support@criticalmanufacturing.com \n"
"Last-Translator: cmf.dev.i18n <info@criticalmanufacturing.com> \n"
"Language: pt-PT \n"
"MIME-Version: 1.0 \n"
"Content-Type: text/plain; charset=UTF-8\n"

#: test\mocks\multilevelExample\mock.pt-PT.ts
#: ONE
msgid "One"
msgstr ""

#: test\mocks\multilevelExample\mock.pt-PT.ts
#: objects.WIDGET
msgid "Widget"
msgstr "Widget"

`;

        let splitResult = util.splitByEmptyLine(stringToSplit);
        chai.expect(splitResult).to.be.exist;
        chai.expect(splitResult.length).to.equal(3);

        chai.expect(splitResult[0]).to.equal(
`# Critical Manufacturing Translation File
# Copyright (C) 2017 Critical Manufacturing S.A.
# This file is distributed under the GPL 3.0 License
# For more information contact@criticalmanufacturing.com
#
msgid ""
msgstr ""
"Project-Id-Version: cmf.dev.i18n 0.0.1 \n"
"Report-Msgid-Bugs-To: support@criticalmanufacturing.com \n"
"Last-Translator: cmf.dev.i18n <info@criticalmanufacturing.com> \n"
"Language: pt-PT \n"
"MIME-Version: 1.0 \n"
"Content-Type: text/plain; charset=UTF-8\n"`);
        chai.expect(splitResult[1]).to.equal(
`#: test\mocks\multilevelExample\mock.pt-PT.ts
#: ONE
msgid "One"
msgstr ""`);
        chai.expect(splitResult[2]).to.equal(
`#: test\mocks\multilevelExample\mock.pt-PT.ts
#: objects.WIDGET
msgid "Widget"
msgstr "Widget"`
        );

    });

    it("should get the correct project version information", () => {
        let projectInfo = util.getProjectInformation();
        let packageJsonInfo = require("../package.json");

        chai.expect(projectInfo.name).to.equal(packageJsonInfo.name);
        chai.expect(projectInfo.version).to.equal(packageJsonInfo.version);
    });
});