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
}

const singleton = new Util();
export default singleton;