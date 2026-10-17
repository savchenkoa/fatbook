import { useQuery } from "@tanstack/react-query";
import { useData } from "../context/data";
import { useAuth } from "../context/auth";

export const DAILY_EATINGS_QUERY_KEY = "dailyEatings";

export function useDailyEatings(day: string) {
    const { userId } = useAuth();
    const data = useData();
    return useQuery({
        queryKey: [DAILY_EATINGS_QUERY_KEY, day, userId],
        queryFn: () => data.fetchDailyEatings(day),
    });
}
