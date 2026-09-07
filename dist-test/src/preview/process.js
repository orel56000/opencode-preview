import { spawn } from "node:child_process";
import { resolve } from "node:path";
import open from "open";
import { RollingBuffer } from "./logs.js";
import { buildUrl, isPortInUse, waitForPort } from "./ports.js";
export class PreviewInstance {
    definition;
    projectDirectory;
    onChange;
    state;
    child;
    startTime;
    stopPromise;
    logs;
    constructor(options) {
        this.definition = options.definition;
        this.projectDirectory = options.projectDirectory;
        this.onChange = options.onChange;
        this.logs = new RollingBuffer({
            maxLines: 2000,
            onChange: () => this.onChange?.(),
        });
        this.state = {
            definition: options.definition,
            status: "stopped",
        };
    }
    getState() {
        return { ...this.state };
    }
    async start() {
        if (this.state.status === "running" || this.state.status === "starting") {
            return this.state.status === "running";
        }
        if (this.stopPromise) {
            await this.stopPromise;
        }
        const host = this.definition.host ?? "localhost";
        const port = this.definition.port;
        const portOccupied = await isPortInUse(port);
        if (portOccupied) {
            this.setState({ status: "port-in-use", error: `Port ${port} already in use` });
            return false;
        }
        const cwd = resolve(this.projectDirectory, this.definition.cwd ?? ".");
        const env = { ...process.env, ...this.definition.env };
        this.setState({ status: "starting", pid: undefined, error: undefined });
        this.logs.clear();
        let exitedEarly = false;
        try {
            this.child = spawn(this.definition.command, {
                shell: true,
                cwd,
                env,
                detached: process.platform !== "win32",
                stdio: ["ignore", "pipe", "pipe"],
            });
        }
        catch (error) {
            this.setState({
                status: "crashed",
                error: `Failed to spawn command: ${String(error)}`,
            });
            return false;
        }
        const pid = this.child.pid;
        if (pid) {
            this.setState({ pid });
        }
        this.child.stdout?.on("data", (data) => {
            const lines = data.toString("utf-8").split(/\r?\n/);
            for (const line of lines) {
                if (line.length > 0)
                    this.logs.push(line);
            }
        });
        this.child.stderr?.on("data", (data) => {
            const lines = data.toString("utf-8").split(/\r?\n/);
            for (const line of lines) {
                if (line.length > 0)
                    this.logs.push(line);
            }
        });
        this.child.on("error", (error) => {
            if (!exitedEarly) {
                exitedEarly = true;
                this.setState({
                    status: "crashed",
                    error: `Process error: ${String(error)}`,
                });
            }
        });
        this.child.on("exit", (code) => {
            if (this.state.status === "starting" || this.state.status === "running") {
                exitedEarly = true;
                const lastLogs = this.logs.getLines().slice(-20).join("\n");
                this.setState({
                    status: "crashed",
                    error: `Process exited${code !== null ? ` with code ${code}` : ""}${lastLogs ? `\n${lastLogs}` : ""}`,
                });
            }
            this.child = undefined;
        });
        const ready = await waitForPort(host, port, { timeout: 30_000, interval: 250 });
        if (exitedEarly) {
            this.child = undefined;
            return false;
        }
        if (!ready) {
            await this.killProcessTree();
            this.child = undefined;
            const lastLogs = this.logs.getLines().slice(-20).join("\n");
            this.setState({
                status: "crashed",
                error: `Timed out waiting for port ${port}${lastLogs ? `\n${lastLogs}` : ""}`,
            });
            return false;
        }
        this.startTime = Date.now();
        this.setState({ status: "running", url: buildUrl(this.definition) });
        return true;
    }
    async stop() {
        if (this.state.status === "stopped" || this.state.status === "crashed") {
            this.child = undefined;
            this.setState({ status: "stopped", pid: undefined, url: undefined, error: undefined });
            return;
        }
        if (this.stopPromise) {
            return this.stopPromise;
        }
        this.stopPromise = this.doStop();
        try {
            await this.stopPromise;
        }
        finally {
            this.stopPromise = undefined;
        }
    }
    async doStop() {
        this.setState({ status: "stopping" });
        await this.killProcessTree();
        this.child = undefined;
        this.startTime = undefined;
        this.setState({ status: "stopped", pid: undefined, url: undefined, error: undefined });
    }
    async restart() {
        await this.stop();
        return this.start();
    }
    async open() {
        const url = buildUrl(this.definition);
        await open(url);
    }
    async dispose() {
        await this.stop();
    }
    setState(patch) {
        this.state = {
            ...this.state,
            ...patch,
            definition: this.definition,
            uptimeMs: this.startTime && patch.status === "running"
                ? Date.now() - this.startTime
                : this.state.uptimeMs,
        };
        this.onChange?.();
    }
    async killProcessTree() {
        const child = this.child;
        if (!child || child.pid === undefined)
            return;
        const pid = child.pid;
        if (process.platform === "win32") {
            await new Promise((resolve) => {
                const killer = spawn("taskkill", ["/T", "/F", "/PID", String(pid)]);
                killer.on("close", () => resolve());
                killer.on("error", () => resolve());
            });
        }
        else {
            try {
                process.kill(-pid, "SIGTERM");
            }
            catch {
                try {
                    process.kill(pid, "SIGTERM");
                }
                catch {
                    // process may already be gone
                }
            }
            await waitForProcessExit(child, 5000);
            try {
                process.kill(-pid, "SIGKILL");
            }
            catch {
                try {
                    process.kill(pid, "SIGKILL");
                }
                catch {
                    // already gone
                }
            }
            // Fallback: enumerate any remaining children and kill them individually.
            await killChildren(pid);
        }
        await waitForPortRelease(this.definition.port);
    }
}
function waitForProcessExit(child, timeout) {
    return new Promise((resolve) => {
        if (child.exitCode !== null) {
            resolve();
            return;
        }
        const timer = setTimeout(() => resolve(), timeout);
        child.on("exit", () => {
            clearTimeout(timer);
            resolve();
        });
    });
}
async function killChildren(parentPid) {
    return new Promise((resolve) => {
        const pgrep = spawn("pgrep", ["-P", String(parentPid)]);
        let output = "";
        pgrep.stdout.on("data", (data) => {
            output += data.toString("utf-8");
        });
        pgrep.on("close", () => {
            const pids = output
                .split(/\s+/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map(Number)
                .filter((n) => Number.isFinite(n));
            for (const pid of pids) {
                try {
                    process.kill(pid, "SIGKILL");
                }
                catch {
                    // ignore
                }
            }
            resolve();
        });
        pgrep.on("error", () => resolve());
    });
}
async function waitForPortRelease(port, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const inUse = await isPortInUse(port);
        if (!inUse)
            return;
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
}
//# sourceMappingURL=process.js.map