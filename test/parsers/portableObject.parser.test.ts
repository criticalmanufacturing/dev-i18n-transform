import * as path from "path";
import * as chai from "chai";
import { PortableObjectParser } from "../../src/parsers/portableObject.parser";
import { File } from "../../src/model/file";

describe("Portable Object Parser", () => {

    it("should be able to parse the simple example", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/simpleExample/mock.po")
        ];
        let parser = new PortableObjectParser("test", mocksPaths);
        let pack = parser.run();
    });

    it("should be able to parse the cross reference", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/crossReferenceExample/test.po")
        ];
        let parser = new PortableObjectParser("test", mocksPaths);
        let pack = parser.run();

        chai.expect(pack).to.exist;
        chai.expect(pack.files).to.exist;
        chai.expect(pack.files).to.have.lengthOf(2);

        // Check reference file

        let referenceFile = pack.files.find((file) => {
            return file.uniqueFileName === "test\\mocks\\crossReferenceExample\\reference.ts";
        });

        chai.expect(referenceFile).to.exist;
        chai.expect(referenceFile.references).to.be.empty;

        chai.expect(referenceFile.messages).to.not.be.empty;
        chai.expect(referenceFile.messages).to.have.lengthOf(2);

        let oneMessage = referenceFile.getMessage("ONE");

        chai.expect(oneMessage).to.exist;
        chai.expect(oneMessage.getTranslation("pt-PT").text).to.equal("Um");

        let twoMessage = referenceFile.getMessage("TWO");

        chai.expect(twoMessage).to.exist;
        chai.expect(twoMessage.getTranslation("pt-PT").text).to.equal("Dois");

        // Check mock file
        let mockFile = pack.files.find((file) => {
            return file.uniqueFileName === "test\\mocks\\crossReferenceExample\\mock.ts";
        });

        let mockOneMessage = mockFile.getMessage("ONE");
        chai.expect(mockOneMessage).to.exist;
        chai.expect(mockOneMessage.getTranslation("pt-PT").isLiteral).to.be.true;
        chai.expect(mockOneMessage.getTranslation("pt-PT").text).to.be.equal("i18n.ONE");

        let mockTwoMessage = mockFile.getMessage("TWO");
        chai.expect(mockTwoMessage).to.exist;
        chai.expect(mockTwoMessage.getTranslation("pt-PT").isLiteral).to.be.false;
        chai.expect(mockTwoMessage.getTranslation("pt-PT").text).to.equal("Este é um preâmbulo com ${i18n.TWO} problemas");

        chai.expect(mockFile.references).to.have.length(1);
    });

    it("should be able to parse duplicated translations", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/duplicatedTextExample/mock.po")
        ];
        let parser = new PortableObjectParser("test", mocksPaths);
        let pack = parser.run();

        chai.expect(pack).to.exist;
        chai.expect(pack.files).to.exist;
        chai.expect(pack.files).to.have.lengthOf(1);

        let referenceFile = pack.files.find((file) => {
            return file.uniqueFileName === "mock.ts";
        });

        chai.expect(referenceFile).to.exist;
        chai.expect(referenceFile.references).to.be.empty;

        chai.expect(referenceFile.messages).to.not.be.empty;
        chai.expect(referenceFile.messages).to.have.lengthOf(2);
    });

    it("should be able parse duplicated translations unified by POEdit program", () => {
        const mocksPaths = [
            path.join(__dirname, "../mocks/duplicatedTextWithCrossReferenceExample/test.po")
        ];
        let parser = new PortableObjectParser("test", mocksPaths);
        let pack = parser.run();

        chai.expect(pack).to.exist;
        chai.expect(pack.files).to.exist;
        chai.expect(pack.files).to.have.lengthOf(3);

        function findFile(files: File[], name: string) {
            return files.find((file) => {
                return file.uniqueFileName === name;
            });
        }

        let mockFile = findFile(pack.files, "test\\mocks\\duplicatedTextWithCrossReferenceExample\\mock.ts");

        chai.expect(mockFile.references).to.exist;
        chai.expect(mockFile.references).to.have.lengthOf(1);
        chai.expect(mockFile.references[0]).to.equal("import i18n from \"./reference.default\";");

        let referenceFile = findFile(pack.files, "test\\mocks\\duplicatedTextWithCrossReferenceExample\\reference.ts");

        chai.expect(referenceFile.references).to.exist;
        chai.expect(referenceFile.references).to.have.lengthOf(1);
        chai.expect(referenceFile.references[0]).to.equal("import i18n from \"./reference2.default\";");

        let reference2File = findFile(pack.files, "test\\mocks\\duplicatedTextWithCrossReferenceExample\\reference2.ts");

        chai.expect(reference2File.references).to.exist;
        chai.expect(reference2File.references).to.have.lengthOf(0);
    });
});