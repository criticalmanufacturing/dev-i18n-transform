import { Package } from "../../src/model/package";
import { createFile, MockFile } from "./file.test";

export interface MockPackage {
    name: string;
    files: MockFile[];
}

/**
 * Create a package model based on a mock package
 * @param pack Mock Package to use as reference to create a system package
 */
export function createPackage(pack: MockPackage): Package {
    let newPack = new Package(pack.name);

    if (pack.files) {
        pack.files.forEach((fileMock) => {
            let file = createFile(fileMock);
            newPack.addOrUpdateFile(file);
        });
    }

    return newPack;
}