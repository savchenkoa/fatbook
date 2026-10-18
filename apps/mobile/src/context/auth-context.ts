import { createContext, useContext } from "react";

interface AppUser {
    id: string;
    email?: string;
    user_metadata?: {
        name?: unknown;
        avatar_url?: unknown;
    };
}

export interface AuthContextValue {
    user: AppUser | null;
    userId: string;
    userCollectionId: number | null;
    loading: boolean;
    supportsOAuth: boolean;
    signInWithEmailPassword(
        email: string,
        password: string,
    ): Promise<{ error: { message: string } | null }>;
    signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("AuthProvider is required");
    return context;
}
