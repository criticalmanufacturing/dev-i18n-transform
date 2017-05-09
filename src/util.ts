export class Util {
    /**
     * Gets the Project information
     */
    public getProjectInformation(): {name: string, version: string} {
        let packageJson = require("../package.json");
        return {
            name: packageJson.name,
            version: packageJson.version
        };
    }

    /**
     * Splits a string by empty lines into multiple pieces.
     * @example
     * // returns ["a", "b"]
     * util.splitByEmptyLine("a
     *
     * b");
     * @param fileContent File content to be split
     * @returns Content of the file split on every empty line.
     */
    public splitByEmptyLine(fileContent: string): string[] {
        return fileContent.replace(/\r/g, "").split(/\n{2,}/g).filter((entry) => entry != null && entry.trim() !== "");
    }

    /**
     * Gets the default language code
     */
    public defaultLanguage: string = "en-US";
}

const singleton = new Util();
export default singleton;