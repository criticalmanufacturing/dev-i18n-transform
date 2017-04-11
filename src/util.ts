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
     * Gets the default language code
     */
    public defaultLanguage: string = "en-US";
}

const singleton = new Util();
export default singleton;