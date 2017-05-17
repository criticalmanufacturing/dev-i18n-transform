import * as winston from "winston";

const logger = new winston.Logger({
    level: "warn",
    transports: [new winston.transports.Console()]
});
export default logger;