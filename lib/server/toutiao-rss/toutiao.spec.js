"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fetch_1 = require("./fetch");
const feed_1 = require("./feed");
const htmlText = fs_1.readFileSync(`${__dirname}/../test/toutiao.html`).toString();
describe("fetch & parse feed", () => {
    it("parses item", () => {
        const items = fetch_1.parseItems(htmlText);
        expect(items).toEqual([]);
    });
    it("merges item", () => {
        const items = fetch_1.parseItems(htmlText);
        const merged = feed_1.mergeItems([], items);
        expect(merged).toEqual([]);
    });
});
