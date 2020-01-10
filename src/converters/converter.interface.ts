import { IDataLocalizedMessages } from "../model/database";

export interface IConverteri18nMethods {
    writeToFile(object: IDataLocalizedMessages, key: string, originalFileName?: string): Promise<string>;
}

export interface IConverterResourcesMethods {
    writeToFile(localized: IDataLocalizedMessages[], contentForEachFile: Map<string, string>, filesResourcesExtension: string): Promise<string[]>;
}