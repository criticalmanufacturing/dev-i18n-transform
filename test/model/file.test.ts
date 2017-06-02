import * as chai from "chai";
import * as path from "path";
import { File } from "../../src/model/file";
import { MockMessage, createMessage } from "./message.test";

export interface MockFile {
    name: string;
    references?: string[];
    messages: MockMessage[];
}

export function createFile(fileMock: MockFile): File {
    let file = new File(fileMock.name);
    fileMock.messages.forEach((m) => {
        file.addOrUpdateMessage(createMessage(m));
    });

    if (Array.isArray(fileMock.references)) {
        fileMock.references.forEach((ref) => {
            file.addOrUpdateReference(ref);
        });
    }

    return file;
}

describe("File model", () => {
    describe("#constructor", () => {
        it("should be able to create a file without messages", () => {
            let file: File = new File("mock.default.ts");

            chai.expect(file).to.exist;
            chai.expect(file.uniqueFileName).to.equal("mock.ts");
        });

        it("should throw an error if the filename doesn't have the correct format", () => {
            try {
                let file = new File("mock.ts");
                chai.assert(false, "It should throw an error while creating the file model");
            } catch (error) {
                chai.expect(error).to.exist;
                chai.expect(error.message).to.contain("doesn't match the correct format");
            }
        });

        it("should use a relative file path if the package path is provided", () => {
            let file = new File(path.join(__dirname, "src", "mock.default.ts"), __dirname);
            chai.expect(file.uniqueFileName).to.be.equal(path.join("src", "mock.ts"));
        });
    });
});