import { z } from "zod";
export declare const PreviewDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    command: z.ZodString;
    cwd: z.ZodDefault<z.ZodString>;
    port: z.ZodNumber;
    host: z.ZodDefault<z.ZodString>;
    path: z.ZodEffects<z.ZodDefault<z.ZodString>, string, string | undefined>;
    env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    autoStart: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    command: string;
    cwd: string;
    port: number;
    host: string;
    path: string;
    env: Record<string, string>;
    autoStart: boolean;
}, {
    id: string;
    name: string;
    command: string;
    port: number;
    cwd?: string | undefined;
    host?: string | undefined;
    path?: string | undefined;
    env?: Record<string, string> | undefined;
    autoStart?: boolean | undefined;
}>;
export type PreviewDefinitionInput = z.input<typeof PreviewDefinitionSchema>;
export declare const PreviewsConfigSchema: z.ZodObject<{
    previews: z.ZodEffects<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        command: z.ZodString;
        cwd: z.ZodDefault<z.ZodString>;
        port: z.ZodNumber;
        host: z.ZodDefault<z.ZodString>;
        path: z.ZodEffects<z.ZodDefault<z.ZodString>, string, string | undefined>;
        env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        autoStart: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        id: string;
        name: string;
        command: string;
        cwd: string;
        port: number;
        host: string;
        path: string;
        env: Record<string, string>;
        autoStart: boolean;
    }, {
        id: string;
        name: string;
        command: string;
        port: number;
        cwd?: string | undefined;
        host?: string | undefined;
        path?: string | undefined;
        env?: Record<string, string> | undefined;
        autoStart?: boolean | undefined;
    }>, "many">, {
        id: string;
        name: string;
        command: string;
        cwd: string;
        port: number;
        host: string;
        path: string;
        env: Record<string, string>;
        autoStart: boolean;
    }[], {
        id: string;
        name: string;
        command: string;
        port: number;
        cwd?: string | undefined;
        host?: string | undefined;
        path?: string | undefined;
        env?: Record<string, string> | undefined;
        autoStart?: boolean | undefined;
    }[]>;
}, "strict", z.ZodTypeAny, {
    previews: {
        id: string;
        name: string;
        command: string;
        cwd: string;
        port: number;
        host: string;
        path: string;
        env: Record<string, string>;
        autoStart: boolean;
    }[];
}, {
    previews: {
        id: string;
        name: string;
        command: string;
        port: number;
        cwd?: string | undefined;
        host?: string | undefined;
        path?: string | undefined;
        env?: Record<string, string> | undefined;
        autoStart?: boolean | undefined;
    }[];
}>;
export type PreviewsConfigInput = z.input<typeof PreviewsConfigSchema>;
//# sourceMappingURL=schema.d.ts.map