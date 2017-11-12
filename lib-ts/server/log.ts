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

const defaultLogLevel = (process.env.NODE_ENV === "production") ? LogLevel.info : LogLevel.debug;

/**
 */
export function getLogger(level = defaultLogLevel) {
    if (cachedLoggers.has(level)) {
        return cachedLoggers.get(level);
    }

    const logger = new winston.Logger({ level });
    logger.add(winston.transports.Console);

    cachedLoggers.set(level, logger);
    return logger;
}
