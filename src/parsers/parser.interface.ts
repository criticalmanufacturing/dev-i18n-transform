import {File} from "../model/file";

export interface Parser {

    /**
     * Analyze
     */
    run(): File[];

}