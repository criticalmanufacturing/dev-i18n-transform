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
     * This method updates or deletes property of an object
     *
     * @param sourceObject The source object to start property navigation
     * @param propertyArray An array with all nested properties to search for
     * @param isDeleteOperation If operation is to delete a property
     * @param value New value for property
     * @param createFields Defines if the method can created nested objects if needed
     * @returns returns false if a given property was not found and true if the field was updated successfully
     */
    private deleteOrSetNestedPropertyByArray(sourceObject: any, propertyArray: Array<string>, isDeleteOperation: boolean, value: any, createFields: boolean): boolean {
         if (!sourceObject) {
            return false;
        }
        if (propertyArray.length > 1) {
            if (propertyArray[0] in sourceObject) {
                let valueToPass = sourceObject[propertyArray.splice(0, 1)[0]];
                return this.deleteOrSetNestedPropertyByArray(valueToPass, propertyArray, isDeleteOperation, value, createFields);
            } else {
                if (!isDeleteOperation && createFields) {
                    sourceObject[propertyArray[0]] = {};
                    let valueToPass = sourceObject[propertyArray.splice(0, 1)[0]];
                    return this.setNestedPropertyByArray(valueToPass, propertyArray, value, createFields);
                } else {
                    return false;
                }
            }
        }
        // Handling of delete and creation of properties
        // if object is of type Map (specially handy for Attributes property of entity type)
        if (sourceObject instanceof Map) {
            if (sourceObject.has(propertyArray[0])) {
                if (isDeleteOperation) {
                    sourceObject.delete(propertyArray[0]);
                }
                else {
                    sourceObject.set(propertyArray[0], value);
                }

                return true;
            }
            else {
                if (!isDeleteOperation && createFields) {
                    sourceObject.set(propertyArray[0], value);
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            if (propertyArray[0] in sourceObject) {
                if (isDeleteOperation) {
                    delete sourceObject[propertyArray[0]];
                }
                else {
                    sourceObject[propertyArray[0]] = value;
                }
                return true;
            } else {
                if (!isDeleteOperation && createFields) {
                    sourceObject[propertyArray[0]] = value;
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    /**
     * This method updates a property of an object, based on the set of properties and a new value.
     * sourceObject: {
     *   prop1: {
     *       prop2 : {
     *           prop3: 123
     *           }
     *      }
     *   }
     * Passing an array literal like ["prop1", "prop2", "prop3"] and a value like "456", will change prop3 from "123" to "456". It creates nested objects along the way
     *
     * @param sourceObject The source object to start property navigation
     * @param propertyArray An array with all nested properties to search for
     * @param value New value for property
     * @param createFields Defines if the method can created nested objects if needed
     * @returns returns false if a given property was not found and true if the field was updated successfully
     */
    public setNestedPropertyByArray(sourceObject: Object, propertyArray: Array<string>, value: any, createFields: boolean): boolean {
       return this.deleteOrSetNestedPropertyByArray(sourceObject, propertyArray, false, value, createFields);
    }

    /**
     * Gets the default language code
     */
    public defaultLanguage: string = "en-US";
}

const singleton = new Util();
export default singleton;