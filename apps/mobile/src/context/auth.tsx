import { AuthResponse, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { setUserMetadata } from "@fatbook/api-client";
import { supabase } from "../lib/supabase";

interface AuthContextType {
    user: User | null;
    userId: string;
    userCollectionId: number | null;
    loading: boolean;
    signInWithEmailPassword: (email: string, password: string) => Promise<AuthResponse>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userId: "guest",
    userCollectionId: null,
    loading: true,
    signInWithEmailPassword: async (email: string, password: string) =>
        supabase.auth.signInWithPassword({ email, password }),
    signOut: async () => { await supabase.auth.signOut(); },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const metadataFound = await setUserMetadata(supabase, session.user);
                setUser(metadataFound ? session.user : null);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        const { data } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === "SIGNED_OUT") {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            data?.subscription.unsubscribe();
        };
    }, []);

    const signInWithEmailPassword = async (
        email: string,
        password: string,
    ): Promise<AuthResponse> => {
        const response = await supabase.auth.signInWithPassword({ email, password });

        if (response.data.user && !response.error) {
            const metadataFound = await setUserMetadata(supabase, response.data.user);
            setUser(response.data.user);
            if (!metadataFound) {
                await supabase.auth.signOut();
                return {
                    ...response,
                    error: {
                        message: "User metadata not found",
                        status: 400,
                    } as never,
                };
            }
        }

        return response;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value: AuthContextType = {
        user,
        userId: user?.id ?? "guest",
        userCollectionId: user?.user_metadata?.collectionId ?? null,
        loading,
        signInWithEmailPassword,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
