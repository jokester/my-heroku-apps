import { readFileSync } from "fs";

import { parseItems } from "./fetch";
import { mergeItems } from "./feed";

const htmlText = readFileSync(`${__dirname}/../test/toutiao.html`).toString();

describe("fetch & parse feed", () => {
    it("parses item", () => {
        const items = parseItems(htmlText);
        expect(items).toEqual([]);
    });

    it("merges item", () => {
        const items = parseItems(htmlText);
        const merged = mergeItems([], items);
        expect(merged).toEqual([]);
    });
});

