"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const RSS = require("rss");
const fetch_1 = require("./fetch");
const feed_1 = require("./feed");
const log_1 = require("../server/log");
const log = log_1.getLogger();
function createFeedHandler() {
    let latestXML;
    let items = [];
    function updateRepo() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const fetched = yield fetch_1.fetchItems();
                log.info(`fetched ${fetched.length} items`);
                const newItems = feed_1.mergeItems(items, fetched);
                // generate RSS xml
                const feed = new RSS({
                    title: "toutiao.io",
                    description: "toutiao.io的非官方RSS repo",
                    generator: "",
                    site_url: "https://toutiao.io",
                    feed_url: "https://jokester-apps.herokuapp.com/rss/toutiao.io.xml",
                    docs: "https://github.com/jokester/my-heroku-apps",
                    webMaster: "me@jokester.io",
                    language: "zh",
                });
                for (const i of newItems) {
                    feed.item(i);
                }
                const newXML = feed.xml();
                latestXML = newXML;
                items = newItems;
            }
            catch (e) {
                log.error(`error in updateRepo`, e);
            }
        });
    }
    setInterval(updateRepo, 1800e3);
    setTimeout(updateRepo);
    return (req, res) => {
        if (!latestXML) {
            res.statusCode = 500;
            res.end("XML not prepared");
        }
        else {
            res.end(latestXML);
        }
    };
}
function attachHandler(app, path = "/rss/toutiao.io.xml") {
    app.get(path, createFeedHandler());
    log.info(`added handler: GET ${path}`);
}
exports.attachHandler = attachHandler;
