import { z } from "zod";
export const PreviewDefinitionSchema = z
    .object({
    id: z
        .string()
        .min(1, "Preview id is required")
        .regex(/^[a-zA-Z0-9_-]+$/, "Preview id must contain only letters, numbers, underscores, and hyphens"),
    name: z.string().min(1, "Preview name is required"),
    command: z.string().min(1, "Command is required"),
    cwd: z.string().default("."),
    port: z.number().int().min(1).max(65535, "Port must be between 1 and 65535"),
    host: z.string().default("localhost"),
    path: z
        .string()
        .default("/")
        .transform((value) => (value.startsWith("/") ? value : `/${value}`)),
    env: z.record(z.string()).default({}),
    autoStart: z.boolean().default(false),
})
    .strict();
export const PreviewsConfigSchema = z
    .object({
    previews: z
        .array(PreviewDefinitionSchema)
        .refine((items) => {
        const ids = new Set();
        for (const item of items) {
            if (ids.has(item.id))
                return false;
            ids.add(item.id);
        }
        return true;
    }, { message: "Duplicate preview ids are not allowed" }),
})
    .strict();
//# sourceMappingURL=schema.js.map