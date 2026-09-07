import { readFile, writeFile, access } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { PreviewsConfigSchema } from "./schema.js";
const CONFIG_FILE = ".opencode/previews.json";
function isInsideProject(projectDirectory, targetPath) {
    const rel = relative(projectDirectory, targetPath);
    return !rel.startsWith("..") && rel !== "..";
}
export function getConfigPath(projectDirectory) {
    return resolve(projectDirectory, CONFIG_FILE);
}
export async function loadPreviewsConfig(projectDirectory) {
    const configPath = getConfigPath(projectDirectory);
    if (!isInsideProject(projectDirectory, configPath)) {
        return { ok: false, error: "Invalid project directory" };
    }
    let raw;
    try {
        raw = await readFile(configPath, "utf-8");
    }
    catch (error) {
        const code = error.code;
        if (code === "ENOENT") {
            return { ok: true, config: { previews: [] } };
        }
        return { ok: false, error: `Cannot read ${CONFIG_FILE}: ${String(error)}` };
    }
    let json;
    try {
        json = JSON.parse(raw);
    }
    catch {
        return { ok: false, error: `${CONFIG_FILE} contains invalid JSON` };
    }
    const parsed = PreviewsConfigSchema.safeParse(json);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`)
            .join("; ");
        return { ok: false, error: `Invalid ${CONFIG_FILE}: ${issues}` };
    }
    return { ok: true, config: parsed.data };
}
export async function savePreviewsConfig(projectDirectory, config) {
    const configPath = getConfigPath(projectDirectory);
    if (!isInsideProject(projectDirectory, configPath)) {
        throw new Error("Invalid project directory");
    }
    const parsed = PreviewsConfigSchema.parse(config);
    await writeFile(configPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
}
export async function registerPreview(projectDirectory, definition) {
    const loaded = await loadPreviewsConfig(projectDirectory);
    if (!loaded.ok) {
        return { ok: false, error: loaded.error };
    }
    const existingIndex = loaded.config.previews.findIndex((preview) => preview.id === definition.id);
    if (existingIndex >= 0) {
        loaded.config.previews[existingIndex] = definition;
    }
    else {
        loaded.config.previews.push(definition);
    }
    try {
        await savePreviewsConfig(projectDirectory, loaded.config);
    }
    catch (error) {
        return { ok: false, error: `Failed to save config: ${String(error)}` };
    }
    return { ok: true };
}
export async function detectPreviews(projectDirectory) {
    const loaded = await loadPreviewsConfig(projectDirectory);
    if (loaded.ok && loaded.config.previews.length > 0) {
        return [];
    }
    const packagePath = resolve(projectDirectory, "package.json");
    let scripts = {};
    try {
        await access(packagePath);
        const raw = await readFile(packagePath, "utf-8");
        const pkg = JSON.parse(raw);
        scripts = pkg.scripts ?? {};
    }
    catch {
        return [];
    }
    const candidates = [];
    if (scripts.dev) {
        candidates.push({
            id: "dev",
            name: "Development server",
            command: "npm run dev",
            port: 5173,
            autoStart: false,
        });
    }
    if (scripts.start) {
        candidates.push({
            id: "start",
            name: "Start server",
            command: "npm run start",
            port: 3000,
            autoStart: false,
        });
    }
    if (scripts.storybook) {
        candidates.push({
            id: "storybook",
            name: "Storybook",
            command: "npm run storybook",
            port: 6006,
            autoStart: false,
        });
    }
    if (scripts.docs) {
        candidates.push({
            id: "docs",
            name: "Documentation",
            command: "npm run docs",
            port: 3001,
            autoStart: false,
        });
    }
    return candidates;
}
//# sourceMappingURL=loader.js.map