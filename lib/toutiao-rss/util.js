"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
exports.http = {
    get: function (url, verbose) {
        return new Promise((fulfill, reject) => {
            request.get({
                url: url,
            }, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else {
                    fulfill(body);
                }
            });
        });
    },
};
