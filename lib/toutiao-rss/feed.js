"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UUID = require("uuid-1345");
function mergeItems(existing, fetched) {
    const merged = existing.slice(0);
    // FIXME: should use map
    const existing_urls = {};
    for (const e of existing) {
        existing_urls[e.url] = e.url;
    }
    for (const i of fetched) {
        if (existing_urls[i.url])
            continue;
        merged.unshift({
            title: i.title,
            description: i.metadata,
            url: i.url,
            // 以加入列表的时间为rss entry的时间
            date: new Date(),
            guid: UUID.v3({ namespace: UUID.namespace.url, name: i.url })
        });
    }
    return merged.slice(0, 40);
}
exports.mergeItems = mergeItems;
