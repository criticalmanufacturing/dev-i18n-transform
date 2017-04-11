import { Package } from "../model/package";

export interface Parser {

    /**
     * Analyze
     */
    run(): Package;

}