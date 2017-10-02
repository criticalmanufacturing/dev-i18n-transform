import * as chai from "chai";
import * as path from "path";
import { createPackage } from "../model/package.test";
import { Package } from "../../src/model/package";
import { TypescriptWriter } from "../../src/writers/typescript.writer";

let chaiString = require("chai-string");
chai.use(chaiString);

describe("Typescript writer", () => {

    it("should be able to write a simple package to typescript", () => {

        // Prepare scenario
        let pack: Package = createPackage({
            name: "test",
            files: [
                {
                    name: "src/components/test/i18n/test.pt-PT.ts",
                    messages: [
                        {
                            id: "ONE",
                            translations: [{
                                lang: "pt-PT",
                                text: "Um"
                            }]
                        },
                        {
                            id: "wizard.TWO",
                            translations: [{
                                lang: "pt-PT",
                                text: "Dois"
                            }]
                        }
                    ]
                }
            ]
        });

        let tsWriter = new TypescriptWriter(pack, "pt-PT");
        let output = tsWriter.run();

        chai.expect(output).to.exist;

        let resultString = `export default {
    ONE: "Um",
    wizard: {
        TWO: "Dois"
    }
};
`;
        chai.expect(output[0].content.toString()).to.equalIgnoreSpaces(resultString);

    });

    it("should be able to write a package with references to typescript", () => {

        // Prepare scenario
        let pack: Package = createPackage({
            name: "test",
            files: [
                {
                    name: "src/components/test/i18n/test.pt-PT.ts",
                    messages: [
                        {
                            id: "ONE",
                            translations: [{
                                lang: "pt-PT",
                                text: "Um"
                            }]
                        }
                    ],
                    references: ["import i18n from \"cmf.core.controls/src/i18n/main.default.ts\";"]
                }
            ]
        });

        let tsWriter = new TypescriptWriter(pack, "pt-PT");
        let output = tsWriter.run();

        chai.expect(output).to.exist;
        chai.expect(output[0].file).to.equal(path.normalize("src/components/test/i18n/test.pt-PT.ts"));

        let resultString = `import i18n from "cmf.core.controls/src/i18n/main.default.ts";

export default {
    ONE: "Um"
};
`;
        chai.expect(output[0].content.toString()).to.be.equalIgnoreSpaces(resultString);

    });
});