import type { ComponentType, ReactNode } from "react";
import type { AuthProvider as SupabaseAuthProvider } from "./supabase-auth";
import { AppText } from "../components/AppText";
import { GoAuthProvider } from "./go-auth";
export { useAuth } from "./auth-context";

const Provider: ComponentType<{ children: ReactNode }> =
    process.env.EXPO_PUBLIC_BACKEND === "go"
        ? GoAuthProvider
        : (
              require("./supabase-auth") as {
                  AuthProvider: typeof SupabaseAuthProvider;
              }
          ).AuthProvider;

export function AuthProvider({ children }: { children: ReactNode }) {
    if (process.env.EXPO_PUBLIC_BACKEND === "go") {
        const url = process.env.EXPO_PUBLIC_API_URL ?? "";
        if (!/^https:\/\//.test(url) && !(__DEV__ && /^http:\/\//.test(url)))
            return (
                <AppText>
                    Укажите EXPO_PUBLIC_API_URL. HTTP разрешён только в режиме
                    разработки.
                </AppText>
            );
    }
    return <Provider>{children}</Provider>;
}
