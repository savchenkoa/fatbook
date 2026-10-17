import { createContext, useContext, useMemo, useRef } from "react";
import { GoApiContext } from "./go-api";
import { useAuth } from "./auth-context";
import { createGoData } from "../data/go-data";
import type { MobileData } from "../data/types";
import type { createSupabaseData } from "../data/supabase-data";

const DataContext = createContext<MobileData | null>(null);
const supabaseBackend = process.env.EXPO_PUBLIC_BACKEND !== "go";

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { userId, userCollectionId } = useAuth();
    const api = useContext(GoApiContext);
    const currentUser = useRef(userId);
    currentUser.current = userId;
    const data = useMemo(() => {
        if (!supabaseBackend) {
            if (!api) throw new Error("GoAuthProvider is required");
            return createGoData(api);
        }
        const adapter = require("../data/supabase-data") as {
            createSupabaseData: typeof createSupabaseData;
        };
        return adapter.createSupabaseData(
            userId,
            userCollectionId,
            () => currentUser.current === userId,
        );
    }, [api, userId, userCollectionId]);
    return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}
export function useData() {
    const data = useContext(DataContext);
    if (!data) throw new Error("DataProvider is required");
    return data;
}
