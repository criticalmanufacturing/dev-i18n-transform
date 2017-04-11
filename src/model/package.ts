import {File} from "./file";

export class Package {
    /**
     * Gets the package name
     */
    public readonly name: string;

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
     * @param name Name of the package
     */
    constructor(name: string) {
        this.name = name;
    }

    /**
     * Verify if the given file already exists in the package
     * @param file File to check if exists
     * @return True if the file exists, false otherwise
     */
    public hasFile(file: File): boolean {
        return file.uniqueFileName in this._files;
    }

    public addOrUpdateFile(file: File): void {
        if (this.hasFile(file)) {
            this._files[file.uniqueFileName].merge(file);
        }else {
            this._files[file.uniqueFileName] = file;
        }
    }
}