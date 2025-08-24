import { OAuthResponse, User, AuthResponse } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { IceCreamSpinner } from "@/components/ui/ice-cream-spinner.tsx";
import { setUserMetadata } from "@/services/user-metadata-service";

interface AuthContextType {
    user: User | null;
    userId: string;
    userCollectionId: number | null;
    signIn: () => Promise<OAuthResponse>;
    signInWithEmailPassword: (email: string, password: string) => Promise<AuthResponse>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userId: "guest",
    userCollectionId: null,
    signIn: () =>
        supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin },
        }),
    signInWithEmailPassword: (email: string, password: string) =>
        supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
});

export function AuthProvider({ children }) {
    const defaultContextValue = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const metadataFound = await setUserMetadata(session.user);
                setUser(metadataFound ? session?.user : null);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_OUT") {
                setUser(session?.user ?? null);
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
        const response = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // We set metadata here, as it doesnt work in the onAuthStateChange.
        // TODO: rethink this use case, maybe we should reuqest metadata only when needed and not in the auth context
        if (response.data.user && !response.error) {
            const metadataFound = await setUserMetadata(response.data.user);
            setUser(response.data.user);
            if (!metadataFound) {
                await supabase.auth.signOut();
                return {
                    ...response,
                    error: {
                        message: "User metadata not found",
                        status: 400,
                    } as any,
                };
            }
        }

        return response;
    };

    // Will be passed down to Signup, Login and other components
    const value: AuthContextType = {
        ...defaultContextValue,
        user,
        userCollectionId: user?.user_metadata?.collectionId ?? null,
        userId: user?.id ?? "guest",
        signInWithEmailPassword,
    };

    if (loading) {
        return <IceCreamSpinner />;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
