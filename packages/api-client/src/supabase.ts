import { createClient, SupabaseClient, SupabaseClientOptions } from "@supabase/supabase-js";
import type { Database } from "./supabase.types";

export type AppSupabaseClient = SupabaseClient<Database>;

export function createSupabaseClient(
    url: string,
    anonKey: string,
    options?: SupabaseClientOptions<"public">,
): AppSupabaseClient {
    return createClient<Database>(url, anonKey, options);
}
