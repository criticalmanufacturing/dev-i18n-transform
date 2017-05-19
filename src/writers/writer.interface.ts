export interface Writer {
    run(): FileOutputInformation[];
}

export interface FileOutputInformation {
    /**
     * Relative file path where to write the file to.
     */
    file: string;
    /**
     * Content of the file to write.
     */
    content: Buffer;
}