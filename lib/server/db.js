"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const url = require("url");
const typeorm_1 = require("typeorm");
const redis_1 = require("redis");
const log_1 = require("./log");
const logger = log_1.getLogger();
function initConnections() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield Promise.all([initPgConn(), testRedisConn()]);
    });
}
exports.initConnections = initConnections;
function readPgCred(urlString) {
    if (!urlString) {
        throw new InitError("$DATABASE_URL not defined");
    }
    const parsed = url.parse(urlString, true, true);
    const authPair = (parsed.auth || ":").split(":");
    const cred = {
        host: parsed.hostname,
        port: parsed.port,
        db: (parsed.pathname || "").substr(1),
        username: authPair[0] || undefined,
        password: authPair[1] || undefined,
    };
    return cred;
}
function initPgConn() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // FIXME: can we PR typeorm?
        const pgCred = readPgCred(process.env.DATABASE_URL);
        yield typeorm_1.createConnection({
            type: "postgres",
            host: pgCred.host,
            username: pgCred.username,
            password: pgCred.password,
            database: pgCred.db,
            extra: {},
        });
        logger.info("connected to PostgreSQL");
    });
}
function createRedisConn(urlString) {
    if (!urlString)
        urlString = process.env.REDIS_URL;
    if (!urlString) {
        throw new InitError("$REDIS_URL not defined");
    }
    return new Promise((fulfill, reject) => {
        const client = redis_1.createClient(urlString);
        client.once("ready", () => {
            fulfill(client);
        });
        client.once("error", reject);
    });
}
function testRedisConn() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const client = yield createRedisConn();
        logger.info("Redis test OK");
        client.quit();
    });
}
class InitError extends Error {
}
exports.InitError = InitError;
