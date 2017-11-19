"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * server-main.ts: init and start a http / ws server
 *
 * - serves http
 * - serves websocket
 * - serves static asset in public/
 * - (DEV only) serves webpack dev bundle
 */
const http = require("http");
const path = require("path");
const express = require("express");
require("reflect-metadata"); // needed by typeorm
const server_1 = require("./server");
const toutiao_rss_1 = require("./toutiao-rss");
const server_2 = require("./plato/server");
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const connectionsInited = server_1.initConnections();
        const port = process.env.PORT || 5000;
        const app = express();
        const server = http.createServer(app);
        const logger = server_1.getLogger();
        server_2.attachHandler(server);
        toutiao_rss_1.attachHandler(app);
        if (process.env.NODE_ENV !== "production") {
            /**
             * add develop-specific middleware
             *
             * NOTE: code in this branch needs dep-only dependicies,
             * set $NODE_ENV accordingly if you don't want this
             */
            logger.warn("enabling webpack dev-middleware and hot-middleware. this would fail if dev deps is not available");
            const webpackDevMiddleware = require("webpack-dev-middleware");
            const webpackHotMiddleware = require("webpack-hot-middleware");
            const webpack = require("webpack");
            const webpackConf = require("../webpack/dev");
            /**
             * append hot-reload client to every webpack entrypoints
             * @see https://www.npmjs.com/package/webpack-hot-middleware
             */
            for (const entryName in webpackConf.entry) {
                const origEntry = webpackConf.entry[entryName];
                const hmrEntry = "webpack-hot-middleware/client?reload=true";
                if (typeof origEntry === "string") {
                    webpackConf.entry[entryName] =
                        [hmrEntry, origEntry];
                }
                else if (origEntry instanceof Array) {
                    webpackConf.entry[entryName] =
                        [hmrEntry].concat(origEntry);
                }
                else {
                    throw new Error(`could not prepend hot-middleware to entry "${entryName}"`);
                }
            }
            const compiler = webpack(webpackConf);
            app.use(webpackDevMiddleware(compiler, {
                quiet: true
            }));
            app.use(webpackHotMiddleware(compiler, {
                reload: true
            }));
        }
        app.use(express.static(path.join(__dirname, "../public")));
        yield connectionsInited;
        server.listen(port, () => {
            logger.info("##################################");
            logger.info(`#### server started listening on http://localhost:${port} `);
            logger.info("##################################");
        });
    });
}
main().catch(e => {
    console.error(e);
    process.exit(1);
});
