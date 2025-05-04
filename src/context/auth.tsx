import { OAuthResponse, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { IceCreamSpinner } from "@/components/ui/IceCreamSpinner";
import { setUserMetadata } from "@/services/user-metadata-service";

interface AuthContextType {
  user: User | null;
  userId: string;
  userCollectionId: number | null;
  signIn: () => Promise<OAuthResponse>;
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

  // Will be passed down to Signup, Login and other components
  const value: AuthContextType = {
    ...defaultContextValue,
    user,
    userCollectionId: user?.user_metadata?.collectionId ?? null,
    userId: user?.id ?? "guest",
  };

  if (loading) {
    return <IceCreamSpinner />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
