import * as url from "url";

import { createConnection } from "typeorm";
import { createClient, RedisClient } from "redis";
import { getLogger } from "./log";

const logger = getLogger();

export async function initConnections() {
    await Promise.all([initPgConn(), testRedisConn()]);
}

function readPgCred(urlString: string) {

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

async function initPgConn() {
    // FIXME: can we PR typeorm?
    const pgCred = readPgCred(process.env.DATABASE_URL);

    await createConnection({
        type: "postgres",
        host: pgCred.host,
        username: pgCred.username,
        password: pgCred.password,
        database: pgCred.db,
        extra: {
        },
    });

    logger.info("connected to PostgreSQL");
}

function createRedisConn(urlString?: string) {
    if (!urlString)
        urlString = process.env.REDIS_URL;

    if (!urlString) {
        throw new InitError("$REDIS_URL not defined");
    }
    return new Promise<RedisClient>((fulfill, reject) => {
        const client = createClient(urlString);

        client.once("ready", () => {
            fulfill(client);
        });
        client.once("error", reject);
    });
}

async function testRedisConn() {
    const client = await createRedisConn();
    logger.info("Redis test OK");
    client.quit();
}

export class InitError extends Error { }
