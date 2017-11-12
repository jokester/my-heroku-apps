"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const cachedLoggers = new Map();
const defaultLogLevel = (process.env.NODE_ENV === "production") ? "info" /* info */ : "debug" /* debug */;
/**
 */
function getLogger(level = defaultLogLevel) {
    if (cachedLoggers.has(level)) {
        return cachedLoggers.get(level);
    }
    const logger = new winston.Logger({ level });
    logger.add(winston.transports.Console);
    cachedLoggers.set(level, logger);
    return logger;
}
exports.getLogger = getLogger;
