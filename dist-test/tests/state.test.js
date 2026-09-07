import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PreviewInstance } from "../src/preview/process.js";
import { createServer } from "node:net";
describe("preview state machine", () => {
    it("starts in stopped state", () => {
        const instance = new PreviewInstance({
            definition: {
                id: "web",
                name: "Frontend",
                command: "node -e \"setTimeout(()=>{}, 1000)\"",
                port: 54330,
            },
            projectDirectory: process.cwd(),
        });
        assert.equal(instance.getState().status, "stopped");
    });
    it("starts and stops a real server", async () => {
        const port = 54331;
        const instance = new PreviewInstance({
            definition: {
                id: "web",
                name: "Frontend",
                command: `node -e "require('http').createServer((req,res)=>res.end('ok')).listen(${port}, '127.0.0.1')"`,
                port,
            },
            projectDirectory: process.cwd(),
        });
        const result = await instance.start();
        assert.equal(result, true);
        assert.equal(instance.getState().status, "running");
        assert.equal(typeof instance.getState().pid, "number");
        await instance.stop();
        assert.equal(instance.getState().status, "stopped");
        assert.equal(instance.getState().pid, undefined);
    });
    it("detects port already in use", async () => {
        const port = 54332;
        const server = createServer();
        await new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve()));
        try {
            const instance = new PreviewInstance({
                definition: {
                    id: "web",
                    name: "Frontend",
                    command: "node -e \"setTimeout(()=>{}, 1000)\"",
                    port,
                },
                projectDirectory: process.cwd(),
            });
            const result = await instance.start();
            assert.equal(result, false);
            assert.equal(instance.getState().status, "port-in-use");
        }
        finally {
            await new Promise((resolve) => server.close(() => resolve()));
        }
    });
});
//# sourceMappingURL=state.test.js.map