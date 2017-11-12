import * as winston from "winston";

export const enum LogLevel {
    error = "error",
    warn = "warn",
    info = "info",
    verbose = "verbose",
    debug = "debug",
    silly = "silly",
}

const cachedLoggers = new Map<LogLevel, winston.LoggerInstance>();
/**
 */
export function getLogger(level = LogLevel.info) {
    if (cachedLoggers.has(level)) {
        return cachedLoggers.get(level);
    }

    const logger = new winston.Logger({ level });
    logger.add(winston.transports.Console);

    cachedLoggers.set(level, logger);
    return logger;
}
