import { StructuredQueryLanguageConverter } from "../../src/converters/sql.converter";
import { IDataLocalizedMessages } from "../../src/model/database";
import * as fs from "fs";
import * as chai from "chai";

const sqlConverter = new StructuredQueryLanguageConverter();

describe("SQL Converter", () => {
    describe("#writeToFile simpleExample", () => {
        it("should have new localized message written", async () => {
            let fileName = "./test/mocks/simpleExample/mock.default.ts";
            let localizedMessage: IDataLocalizedMessages = {localizedMessageName: "test.test1#test",
                                                            localizedMessageText: "ok",
                                                            cultureName: "en-US"};
            let path = await sqlConverter.writeToFile(localizedMessage, null, fileName).then((output: string) => { return output; });

            fs.readFile(fileName, function (err, data) {
                chai.expect(fileName).to.exist;
                chai.expect(data.toString()).to.include(`test: "ok"`);
            });
            chai.expect(path).to.be.equal(fileName);
        });
        it("should append the new localized message in end of file", async () => {
            let fileName = "./test/mocks/simpleExample/mock.default.ts";
            let localizedMessage: IDataLocalizedMessages = {localizedMessageName: "test.simpleExample#SEVEN",
                                                            localizedMessageText: `Seven`,
                                                            cultureName: "en-US"};
            let path = await sqlConverter.writeToFile(localizedMessage, null, fileName).then((output: string) => { return output; });

            fs.readFile(fileName, function (err, data) {
                chai.expect(fileName).to.exist;
                chai.expect(data.toString()).to.include(`SEVEN: "Seven"`);
            });
            chai.expect(path).to.equal(fileName);
        });
    });
    describe("#writeToFile multilineExample", () => {
        it("should have new localized message written", async () => {
            let fileName = "./test/mocks/multilineExample/mock.default.ts";
            let localizedMessage: IDataLocalizedMessages = {localizedMessageName: "test.test1#test",
                                                            localizedMessageText: `New multiline test" + \n"another line`,
                                                            cultureName: "en-US"};
            let path = await sqlConverter.writeToFile(localizedMessage, null, fileName).then((output: string) => { return output; });

            fs.readFile(fileName, function (err, data) {
                chai.expect(fileName).to.exist;
            });
            chai.expect(path).to.equal(fileName);
        });
    });
    describe("#writeToFile multilevelExample", () => {
        it("should have new localized message written", async () => {
            let fileName = "./test/mocks/multilevelExample/mock.default.ts";
            let localizedMessage: IDataLocalizedMessages = {localizedMessageName: "test123.test1234#test.test1.test2",
                                                            localizedMessageText: "ok",
                                                            cultureName: "en-US"};
            let path = await sqlConverter.writeToFile(localizedMessage, null, fileName).then((output: string) => { return output; });

            fs.readFile(fileName, function (err, data) {
                chai.expect(fileName).to.exist;
                chai.expect(data.toString()).to.include(`test2: "ok"`);
            });
            chai.expect(path).to.equal(fileName);

            localizedMessage = {localizedMessageName: "test.multilevelExample#actionButtons.preview.TEST",
                                localizedMessageText: "Test",
                                cultureName: "en-US"};
            path = await sqlConverter.writeToFile(localizedMessage, null, fileName).then((output: string) => { return output; });

            fs.readFile(fileName, function (err, data) {
                chai.expect(data.toString()).to.include(`            TEST: "Test"`);
            });
            chai.expect(path).to.equal(fileName);

            localizedMessage = {localizedMessageName: "test.multilevelExample#actionButtons.preview.newSection.TEST_SECTION",
                                localizedMessageText: "New Section",
                                cultureName: "en-US"};
            path = await sqlConverter.writeToFile(localizedMessage, null, fileName).then((output: string) => { return output; });

            fs.readFile(fileName, function (err, data) {
                chai.expect(fileName).to.exist;
                chai.expect(data.toString()).to.include(`preview: {\n            newSection: {\n                TEST_SECTION: "New Section"\n            }`);
            });
            chai.expect(path).to.equal(fileName);
        });
    });
});