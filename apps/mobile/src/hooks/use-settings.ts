import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "@fatbook/api-client";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

export function useSettings() {
    const { userId } = useAuth();
    return useQuery({
        queryKey: ["settings"],
        queryFn: () => fetchSettings(supabase, userId),
    });
}
