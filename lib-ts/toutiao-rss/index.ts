import http = require("http");
import { Request, Response, Express } from "express";
import * as RSS from "rss";

import { fetchItems } from "./fetch";
import { mergeItems, RSSItemOptions } from "./feed";
import { getLogger } from "../server/log";

const log = getLogger();

function createFeedHandler() {

    let latestXML: string;

    let items: RSSItemOptions[] = [];

    async function updateRepo() {
        try {
            const fetched = await fetchItems();
            log.info(`fetched ${fetched.length} items`);
            const newItems = mergeItems(items, fetched);

            // generate RSS xml
            const feed = new RSS({
                title: "toutiao.io",
                description: "toutiao.io的非官方RSS repo",
                generator: "", //
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
        } catch (e) {
            log.error(`error in updateRepo`, e);
        }
    }

    setInterval(updateRepo, 1800e3);
    setTimeout(updateRepo);

    return (req: Request, res: Response) => {
        if (!latestXML) {
            res.statusCode = 500;
            res.end("XML not prepared");
        } else {
            res.end(latestXML);
        }
    };
}

export function attachHandler(app: Express, path = "/rss/toutiao.io.xml") {
    app.get(path, createFeedHandler());
    log.info(`added handler: GET ${path}`);
}