import { createContext, useContext } from "solid-js";
export const PreviewContext = createContext(undefined);
export function usePreview() {
    const value = useContext(PreviewContext);
    if (!value) {
        throw new Error("usePreview must be used inside PreviewContext.Provider");
    }
    return value;
}
//# sourceMappingURL=context.js.map