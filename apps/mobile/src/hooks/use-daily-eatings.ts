import { useQuery } from "@tanstack/react-query";
import { fetchDailyEatings } from "@fatbook/api-client";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";

export const DAILY_EATINGS_QUERY_KEY = "dailyEatings";

export function useDailyEatings(day: string) {
    const { userId } = useAuth();
    return useQuery({
        queryKey: [DAILY_EATINGS_QUERY_KEY, day],
        queryFn: () => fetchDailyEatings(supabase, userId, day),
    });
}
