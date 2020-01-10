//#region Imports
import * as mssql from "mssql";
import { IConnectDatabase, IDatabaseMethods } from "./database.interface";

const argv = require("minimist")(process.argv);

// Import config
let config: any;
if (argv["config"] === undefined || argv["config"] === null) {
  config = require("../i18n-import.config.json");
} else {
  config = require(argv["config"]);
}

//#endregion

//#region Interfaces
export interface IDataLocalizedMessages {
    localizedMessageName: string;
    cultureName: string;
    localizedMessageText: string;
}
//#endregion

//#region Constants

export const connectionToDatabase: IConnectDatabase = {
    server: (<any>config).database.server,
    user: (<any>config).database.user.name,
    password: (<any>config).database.user.password,
    database: (<any>config).database.name,
    connectionTimeout: 30000,
    driver: "tedious",
    stream: false
};

/** SQL Queries*/

/**
 * Query to get i18n localized messages
 */
export const SQL_Geti18nLocalizedMessages: string =  `select l.name as LocalizedMessageName, c.name as CultureName,
                                                  l.MessageText as LocalizedMessageText from T_LocalizedMessage L
                                                  INNER JOIN T_Culture C ON (l.CultureId = c.CultureId)
                                                  WHERE l.name LIKE `;

/**
 * Query to get resources localized messages
 */
export const SQL_GetResourcesLocalizedMessages: string = `select l.name as LocalizedMessageName, c.name as CultureName,
                                                          l.MessageText as LocalizedMessageText from T_LocalizedMessage L
                                                          INNER JOIN T_Culture C ON (l.CultureId = c.CultureId)
                                                          WHERE l.name NOT LIKE `;

/**
 * Query to delete localized messages using their name
 */
export const SQL_DeleteLocalizedMessage: string = `delete from T_LocalizedMessage where name=`;

//#endregion

export class DatabaseManagement implements IDatabaseMethods {

    //#region Private Properties
    private _connectionPoll: mssql.ConnectionPool;
    //#endregion

    //#region Public Methods

    /**
     * Using the constant "connection_database", this method returns a connection to specified database
     * If occurs an error, a message is displayed in console and a new attempt to connect is made
     * @param connectionToDatabase (constant with information to access database)
     */
    public async getConnection(connectionToDatabase: IConnectDatabase) {
        try {
            const _connectionPoll = await new mssql.ConnectionPool(connectionToDatabase).connect();
            return _connectionPoll;
        }
        catch (err) {
            console.log("Database Connection Failed! Bad Config: ", err);
            this._connectionPoll = await new mssql.ConnectionPool(connectionToDatabase).connect();
            return this._connectionPoll;
        }
    }

    /**
     * Get all localized messages in database and
     * returns a array of type IData with all
     * @param connectionToDatabase (constant with information to access database)
     * @param sqlCommand (query to get all localized messages in database)
     * @param packages (packages in config.packages.i18n)
     */
    public async getLocalizedMessages(connectionToDatabase: IConnectDatabase, sqlCommand: string, packages: string[]): Promise<IDataLocalizedMessages[]> {

        const arrayTyped: IDataLocalizedMessages[] = [];
        let filteredSqlCommand: string = sqlCommand;

        // Get connection to database
        let connected = await this.getConnection(connectionToDatabase);

        for (let index in packages) {
            filteredSqlCommand = sqlCommand + `'${packages[index]}.%'`;
            // Execute query to get all localized messages
            let result = await connected.request().query(filteredSqlCommand);

            if (result.recordset.length > 0) {
                // Put each localized messaged received from database into an array
                for (let entry of result.recordset) {
                    arrayTyped.push({ cultureName:  entry["CultureName"],
                                    localizedMessageName: entry["LocalizedMessageName"],
                                    localizedMessageText: entry["LocalizedMessageText"]
                                    });
                }
            }
            filteredSqlCommand = sqlCommand;
        }

        // Close connection to database
        connected.close();
        return Promise.resolve(arrayTyped);
    }

    /**
     * Delete localized messages from database using their name
     * @param connectionToDatabase (constant with information to access database)
     * @param sqlCommand (query to delete localized messages using name)
     * @param LocalizedMessages (array with all localized messages treated)
     */
    public async deleteLocalizedMessages(connectionToDatabase: IConnectDatabase, sqlCommand: string, localizedMessages: IDataLocalizedMessages[]) {

        // Get connection to database
        let connected = await this.getConnection(connectionToDatabase);

        // Each localized message in localizedMessages is deleted of database
        for (let i = 0; i < localizedMessages.length; i++) {
            let sqlDeleteCommand = `${sqlCommand} '${localizedMessages[i].localizedMessageName}'`;
            await connected.request().query(sqlDeleteCommand);
        }

        // Close connection to database
        connected.close();
    }

    //#endregion
}