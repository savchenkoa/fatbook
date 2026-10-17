import { createContext, useContext } from "react";
import type { GoApi } from "@fatbook/api-client/go";

export const GoApiContext = createContext<GoApi | null>(null);
export function useGoApi() {
    const api = useContext(GoApiContext);
    if (!api) throw new Error("GoAuthProvider is required");
    return api;
}
