import * as chai from "chai";
import * as path from "path";
import { TypescriptParser } from "../../src/parsers/typescript.parser";
import { Message } from "../../src/model/message";

describe("Typescript parser", () => {

    it("should parse the simpleExample", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/simpleExample/mock.default.ts"),
            path.join(__dirname, "../mocks/simpleExample/mock.pt-PT.ts")
        ];

        let ts = new TypescriptParser("test", mocksPaths);
        let pack = ts.run();

        chai.expect(pack.files).to.have.length(1);

        let file = pack.files[0];
        chai.expect(file.uniqueFileName).to.contain("mock.ts");
        chai.expect(file.messages).to.have.length(6);

        let messageOne = file.getMessage("ONE");
        chai.expect(messageOne).to.exist;

        let messageFour = file.getMessage("FOUR");
        chai.expect(messageFour).to.exist;

        // Verify comments interpretation
        chai.expect(messageOne.description).to.exist;
        chai.expect(messageOne.description).to.equal("Property comments");

        chai.expect(messageOne.hasTranslation("en-US")).to.be.true;
        chai.expect(messageOne.getTranslation("pt-PT").text).to.equal("Um");
        chai.expect(messageOne.hasTranslation("-1")).to.be.false;

        // Check for binary
        let messageSix = file.getMessage("SIX");
        chai.expect(messageSix).to.exist;
        chai.expect(messageSix.hasTranslation("en-US")).to.be.true;
        chai.expect(messageSix.getTranslation("en-US").text).to.be.equal("6 + \"\"");
    });

    it("should parse the multilevelExample", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/multilevelExample/mock.default.ts"),
            path.join(__dirname, "../mocks/multilevelExample/mock.pt-PT.ts"),
            path.join(__dirname, "../mocks/multilevelExample/mock.vi-VN.ts")
        ];

        const messageIds = [
            "actionButtons.preview.TITLE",
            "actionButtons.settings.TITLE",
            "menu.DASHBOARDS",
            "objects.PAGE",
            "objects.STEP",
            "objects.WIDGET",
            "objects.WIZARD",
            "ONE",
            "pages.page.widget.ERROR_LOADING",
            "pages.pageViewer.TITLE"
        ];

        let ts = new TypescriptParser("test", mocksPaths);
        let pack = ts.run();

        chai.expect(pack.files).to.have.length(1);

        let file = pack.files[0];
        chai.expect(file.uniqueFileName).to.contain("mock.ts");
        chai.expect(file.messages).to.have.length(messageIds.length);

        let messageOne = file.getMessage("ONE");
        chai.expect(messageOne).to.exist;
        chai.expect(messageOne.hasTranslation("en-US")).to.be.true;
        chai.expect(messageOne.hasTranslation("pt-PT")).to.be.false;

        chai.expect(file.messages).satisfy((messages: Message[]) => {
            return messages.every((msg) => {
                return messageIds.indexOf(msg.id) >= 0;
            });
        });
    });

    it("should parse the crossReferenceExample", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/crossReferenceExample/mock.default.ts"),
            path.join(__dirname, "../mocks/crossReferenceExample/mock.pt-PT.ts"),
            path.join(__dirname, "../mocks/crossReferenceExample/reference.default.ts"),
            path.join(__dirname, "../mocks/crossReferenceExample/reference.pt-PT.ts")
        ];

        const messageIds = [
            "ONE",
            "TWO",
            "THREE",
            "FOUR",
            "FIVE",
            "OTHER_NODE",
            "SIX"
        ];

        let ts = new TypescriptParser("test", mocksPaths);
        let pack = ts.run();

        chai.expect(pack.files).to.have.length(2);

        let file = pack.files[1];
        chai.expect(file.uniqueFileName).to.contain("mock.ts");
        chai.expect(file.messages).to.have.length(messageIds.length);

        let messageOne = file.getMessage("ONE");
        chai.expect(messageOne).to.exist;
        chai.expect(messageOne.hasTranslation("en-US")).to.be.true;
        chai.expect(messageOne.hasTranslation("pt-PT")).to.be.true;

        chai.expect(messageOne.getTranslation("en-US").isLiteral).to.be.true;

        chai.expect(file.messages).satisfy((messages: Message[]) => {
            return messages.every((msg) => {
                return messageIds.indexOf(msg.id) >= 0;
            });
        });
    });

    it("should parse multilineExample", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/multilineExample/mock.default.ts")
        ];

        let ts = new TypescriptParser("test", mocksPaths);
        let pack = ts.run();

        chai.expect(pack.files).to.have.length(1);

        let file = pack.files[0];
        chai.expect(file.uniqueFileName).to.contain("mock.ts");
        chai.expect(file.messages).to.have.length(2);

        let message = file.getMessage("MULTILINE");
        chai.expect(message).to.exist;
        chai.expect(message.getTranslation("en-US").text.toString()).to.be.equalIgnoreSpaces("My ${\"multi\" + \"\" + \"line\"}");
    });

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
    });
});