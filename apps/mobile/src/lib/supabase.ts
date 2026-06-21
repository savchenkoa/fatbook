import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSupabaseClient } from "@fatbook/api-client";
import type { AppSupabaseClient } from "@fatbook/api-client";

export const supabase: AppSupabaseClient = createSupabaseClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            storage: AsyncStorage,
            detectSessionInUrl: false,
        },
    },
);
