import { createConnection, getConnection } from "typeorm";

export function createContext() {
    return ({
        getPgConnection: getConnection,


    });
}

/**
 * Resources (mostly db connections)
 */
interface ServerContext

