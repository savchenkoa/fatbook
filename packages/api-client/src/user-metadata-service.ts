import { User } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "./supabase";
import { Tables } from "./supabase.types";

export type UserMetadata = Omit<Tables<"user_metadata">, "id">;

/* Adds collectionId to user */
export async function setUserMetadata(
    supabase: AppSupabaseClient,
    user: User,
): Promise<boolean> {
    const metadata = await getUserMetadata(supabase, user);

    if (!metadata) {
        return false;
    }

    user.user_metadata = {
        ...user.user_metadata,
        ...metadata,
    };
    return true;
}

async function getUserMetadata(
    supabase: AppSupabaseClient,
    user: User,
): Promise<UserMetadata | null | undefined> {
    const userRecords = await supabase.from("user_metadata").select().eq("id", user.id);

    return userRecords?.data?.[0];
}
