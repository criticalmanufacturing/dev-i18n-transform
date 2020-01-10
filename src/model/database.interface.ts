import { IDataLocalizedMessages } from "./database";

export interface IConnectDatabase {
    server: string;
    user: string;
    password: string;
    database: string;
    connectionTimeout: number;
    driver: string;
    stream: boolean;
}

export interface IDatabaseMethods {
    getConnection(connectionToDatabase: IConnectDatabase): Promise<any>;
    getLocalizedMessages(connectionToDatabase: IConnectDatabase, SQL_Command: string, packages: string[]): Promise<IDataLocalizedMessages[]>;
    deleteLocalizedMessages(connectionToDatabase: IConnectDatabase, SQL_Command: string, localizedMessages: IDataLocalizedMessages[]): Promise<void>;
}