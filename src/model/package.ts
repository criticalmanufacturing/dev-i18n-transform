import * as path from "path";
import {File} from "./file";

export class Package {
    /**
     * Gets the package name
     */
    public readonly name: string;

    /**
     * Gets the package path (including the package name)
     */
    public readonly path: string;

    private readonly _files: {[key: string]: File} = {};

    /**
     * Gets all package files
     */
    public get files(): File[] {
        return Object.keys(this._files).map((index) => {
            return this._files[index];
        });
    }

    /**
     * Creates a new Package structure
     * @param packagePath Name of the package
     */
    constructor(packagePath: string) {
        this.path = path.normalize(packagePath);
        this.name = path.basename(packagePath);
    }

    /**
     * Verify if the given file already exists in the package
     * @param file File to check if exists
     * @return True if the file exists, false otherwise
     */
    public hasFile(file: File): boolean {
        return file.uniqueFileName in this._files;
    }

    /**
     * Adds a file to the package.
     * If the a file with the same with the same identifier already exists in the package, it's merged {@see File.merge} with the existing one.
     * @param file File to be added or updated.
     */
    public addOrUpdateFile(file: File): void {
        if (this.hasFile(file)) {
            this._files[file.uniqueFileName].merge(file);
        }
        else {
            this._files[file.uniqueFileName] = file;
        }
    }
}