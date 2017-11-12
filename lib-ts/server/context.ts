import { createConnection, getConnection } from "typeorm";

/**
 * A context that can be used to run other services
 */
export function createContext() {
    return ({
        getPgConnection: getConnection,


    });
}

/**
 * Resources (mostly db connections)
 */
interface ServerContext {}

