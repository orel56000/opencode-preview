import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RollingBuffer } from "../src/preview/logs.js";
describe("rolling log buffer", () => {
    it("stores lines", () => {
        const buffer = new RollingBuffer({ maxLines: 5 });
        buffer.push("one");
        buffer.push("two");
        assert.deepEqual(buffer.getLines(), ["one", "two"]);
    });
    it("evicts oldest lines when limit exceeded", () => {
        const buffer = new RollingBuffer({ maxLines: 3 });
        buffer.push("one");
        buffer.push("two");
        buffer.push("three");
        buffer.push("four");
        assert.deepEqual(buffer.getLines(), ["two", "three", "four"]);
    });
    it("clears all lines", () => {
        const buffer = new RollingBuffer({ maxLines: 10 });
        buffer.push("one");
        buffer.clear();
        assert.deepEqual(buffer.getLines(), []);
    });
    it("fires onChange callback", () => {
        let calls = 0;
        const buffer = new RollingBuffer({
            maxLines: 3,
            onChange: () => {
                calls++;
            },
        });
        buffer.push("one");
        buffer.clear();
        assert.equal(calls, 2);
    });
});
//# sourceMappingURL=logs.test.js.map