#!/usr/bin/env node

//#region Imports
import { DatabaseManagement,
         IDataLocalizedMessages,
         SQL_Geti18nLocalizedMessages,
         SQL_DeleteLocalizedMessage,
         SQL_GetResourcesLocalizedMessages,
         connectionToDatabase } from "../model/database";
import { StructuredQueryLanguageConverter } from "../converters/sql.converter";
import { ResourcesConverter } from "../converters/resources.converter";
import { AzDevOpsManagement } from "../azureDevOps/azDevOps";
import { IConnectAzDevOps, IIterationDetails } from "../azureDevOps/azDevOps.interface";
import * as fs from "fs";

const argv = require("minimist")(process.argv);

// Import config
let config: any;
if (argv["config"] === undefined || argv["config"] === null) {
  config = require("../i18n-import.config.json");
} else {
  config = require(argv["config"]);
}

//#endregion

export class Program {

    //#region Private Properties

    private filesResourcesExtension: string = ".resx";

    //#endregion

    //#region Private Methods

    /**
     * Find all files in specific folder with specific extension
     * @param path Path to get files
     * @param extension Extension name, e.g: '.resx'
     */
    private getFilesFromPath(path: string, extension: string) {
        let dir = fs.readdirSync( path );
        return dir.filter( (elm: string) => elm.match(new RegExp(`^[A-z0-9]+\.${extension}$`, "ig")));
    }

    //#endregion


    //#region Public Methods

    public async Main() {
        try {

            // Access class DatabaseManagement
            let db = new DatabaseManagement();
            // Access class AzDevOpsManagement
            let tfs = new AzDevOpsManagement();
            // Access class StructuredQueryLanguageConverter
            let i18nConverter = new StructuredQueryLanguageConverter();
            // Access class ResourcesConvertes
            let resourcesConverter = new ResourcesConverter();
            // Array to store localized messages
            let localized: IDataLocalizedMessages[] = [];
            // Story number of user story
            let userStory: number;

            // Get keys in config.packages.i18n
            let packagesi18n = Object.keys((<any>config).packages.i18n);

            // Get i18n Localized Messages in database
            await db.getLocalizedMessages(connectionToDatabase, SQL_Geti18nLocalizedMessages, packagesi18n).then(async (output: IDataLocalizedMessages[]) => {
                localized = output;

                if (localized.length === 0) {
                    return;
                }

                // Map with all localized messages distributed by its name
                let mapWithPathsChanged = new Map<string, string[]>();

                /*
                *   For each Localized Message returned by "getLocalizedMessages()", call method "writeToFile"
                *   giving as argument a localized message (Name, Culture, Text)
                *   Populate "mapWithPathsChanged" where keys are the elements of packages and values an array with paths changed
                */
                for (let index in packagesi18n) {
                    let newArray: string[] = [];
                    for ( let i in localized ) {
                        if (localized[i].localizedMessageName.match(packagesi18n[index])) {
                            let pathToWrite = await i18nConverter.writeToFile(localized[i], packagesi18n[index]).then((path: string) => { return path; });
                            if (newArray.includes(pathToWrite) !== true) {
                                newArray.push(pathToWrite);
                            }
                        }
                    }
                    mapWithPathsChanged.set(packagesi18n[index], newArray);
                }

                /*
                *   Get connection to TFS
                */
                let connection = await tfs.getConnection().then((output: IConnectAzDevOps) => { return output; });

                /**
                *   Get current iteration
                */
                let currentIteration = await tfs.getCurrentIteration(connection.iteration).then((output: IIterationDetails) => { return output; });

                /**
                 *  Check if US already exists
                 */
                let userStoryId = await tfs.checkIfUSAlreadyExist(connection.workItem, currentIteration.path);

                /**
                 *  If userStoryId equals null, a new user story is created for current iteration
                 *  In negative case, "userStory" equals to returned "userStoryId"
                 */
                if (userStoryId === null) {
                    userStory = await tfs.createUserStory(connection.workItem, currentIteration.path);
                }
                else {
                    userStory = userStoryId;
                }

                /**
                 * For each package in config.packages, get values of "mapWithPathsChanged"
                 * If the length of value is higher than 0, get repository of that package and
                 * create commit, push and a pull request for the specified repository
                 */
                for (let index in packagesi18n) {
                    let paths = mapWithPathsChanged.get(packagesi18n[index]);
                    if (paths.length > 0) {
                        let repository = (<any>config).packages.i18n[packagesi18n[index]].repository;
                        let commitedAndPushedBy = await tfs.createCommitsAndPush(connection.git, packagesi18n[index], paths, repository);
                        let pullRequestId = await tfs.createPR(connection.git, repository, userStory);
                        await tfs.updatePR(connection.git, pullRequestId, repository, commitedAndPushedBy);
                    }
                }

                /*
                 *   Delete Localized Messages already translated and written
                 */
                await db.deleteLocalizedMessages(connectionToDatabase, SQL_DeleteLocalizedMessage, localized);
            });

            /**
             *  Get resources Localized Messages in database
             *  Ignore localized messages that match with packagesi18n
             */
            localized = await db.getLocalizedMessages(connectionToDatabase, SQL_GetResourcesLocalizedMessages, packagesi18n);

            // If there are not localized messages, finish the process
            if (localized.length === 0) {
                process.exit();
            }

            // Get packages in resources
            let packagesResources = Object.keys((<any>config).packages.resources);

            for (let index in packagesResources) {
                // Map with folders as keys and respective files as values
                let filesForEachResourcesPath: Map<string, string[]> = new Map<string, string[]>();

                // Map with file name as key and respective content as value
                let contentForEachFile: Map<string, string> = new Map<string, string>();

                // Get files of packages in config.packages.resources[index]
                if ((<any>config).packages.resources[packagesResources[index]].length > 0) {
                    for (let i = 0; i < (<any>config).packages.resources[packagesResources[index]].length; i++) {
                        filesForEachResourcesPath.set((<any>config).packages.resources[packagesResources[index]][i],
                                                      this.getFilesFromPath((<any>config).packages.resources[packagesResources[index]][i], this.filesResourcesExtension));
                    }
                }

                // Read all files in "filesForEachResourcesPath"
                if (filesForEachResourcesPath.size > 0) {
                    // Get keys in "filesForEachResourcesPath"
                    let packagesResourcesArray = Array.from(filesForEachResourcesPath.keys());
                    // Fill map "contentForEachFile" with filename as key and respective content as value
                    for (let i = 0; i < packagesResourcesArray.length; i++) {
                        // If we have more than one resource file to the same path
                        if (filesForEachResourcesPath.get(packagesResourcesArray[i]).length > 1) {
                            for (const iterator of filesForEachResourcesPath.get(packagesResourcesArray[i])) {
                                let file: string = packagesResourcesArray[i] + "\\" + iterator;
                                let content: string = fs.readFileSync(file).toString();
                                contentForEachFile.set(file, content);
                            }
                        }
                        else {
                            let file: string = packagesResourcesArray[i] + "\\" + filesForEachResourcesPath.get(packagesResourcesArray[i]);
                            let content: string = fs.readFileSync(file).toString();
                            contentForEachFile.set(file, content);
                        }
                    }
                }
                let filesChanged: string[] = await resourcesConverter.writeToFile(localized, contentForEachFile, this.filesResourcesExtension);

                if (filesChanged !== undefined && filesChanged.length > 0) {
                    /*
                    *   Get connection to TFS
                    */
                    let connection = await tfs.getConnection().then((output: IConnectAzDevOps) => { return output; });

                    /**
                     *   Get current iteration
                     */
                    let currentIteration = await tfs.getCurrentIteration(connection.iteration).then((output: IIterationDetails) => { return output; });

                    /**
                     *  Check if US already exists
                     */
                    let userStoryId = await tfs.checkIfUSAlreadyExist(connection.workItem, currentIteration.path);

                    /**
                     *  If userStoryId equals null, a new user story is created for current iteration
                     *  In negative case, "userStory" equals to returned "userStoryId"
                     */
                    if (userStoryId === null) {
                        userStory = await tfs.createUserStory(connection.workItem, currentIteration.path);
                    }
                    else {
                        userStory = userStoryId;
                    }

                    /**
                     * If the length of filesChanged is higher than 0, get repository of that package and
                     * create commit, push and a pull request for the specified repository
                     */
                    let repository = packagesResources[index];
                    let commitedAndPushedBy = await tfs.createCommitsAndPush(connection.git, packagesResources[index], filesChanged, repository);
                    let pullRequestId = await tfs.createPR(connection.git, repository, userStory);
                    await tfs.updatePR(connection.git, pullRequestId, repository, commitedAndPushedBy);
                }
            }

            // Finish the process
            process.exit();
        }
        catch (err) {
            console.log(err);
        }
    }

    //#endregion
}

/*
*   Call method "Main()"
*/
let program = new Program();
program.Main();