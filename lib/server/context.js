"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
/**
 * A context that can be used to run other services
 */
function createContext() {
    return ({
        getPgConnection: typeorm_1.getConnection,
    });
}
exports.createContext = createContext;
