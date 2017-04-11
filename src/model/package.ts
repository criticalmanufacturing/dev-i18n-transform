import {File} from "./file";

export class Package {
    /**
     * Gets the package name
     */
    public readonly name: string;

    private readonly _files: {[key: string]: File} = {};

    /**
     * Creates a new Package structure
     * @param name Name of the package
     */
    constructor(name: string) {
        this.name = name;
    }
}