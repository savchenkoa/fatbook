import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase.types";

export type AppSupabaseClient = SupabaseClient<Database>;

export function createSupabaseClient(url: string, anonKey: string): AppSupabaseClient {
    return createClient<Database>(url, anonKey);
}
