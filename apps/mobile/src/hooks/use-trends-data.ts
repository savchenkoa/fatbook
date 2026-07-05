import { useQuery } from "@tanstack/react-query";
import { getDaysBetween, now, nowAsDate, subtractDays, sumFoodValues } from "@fatbook/shared";
import type { FoodValue } from "@fatbook/shared";
import { fetchTrendsData } from "@fatbook/api-client";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";
import { useSettings } from "./use-settings";

export interface DailyTrend {
    /** ISO day (YYYY-MM-DD) for the bar's X-axis label. */
    day: string;
    calories: number;
    proteins: number;
    fats: number;
    carbs: number;
}

interface TrendsResult {
    isLoading: boolean;
    /** One entry per day in the range, zero-filled for days with no eatings. */
    chartData: DailyTrend[];
    /** Average food value per day over the range. */
    average?: FoodValue;
    /** Daily goal from user settings. */
    goal?: FoodValue;
}

/**
 * Aggregates the last `days` days of eatings for the Insights screen: the
 * per-day series (for the trend chart) plus the daily average (for the summary
 * gauges). Mirrors the web `use-trends-data`, adapted to the mobile providers.
 */
export function useTrendsData(days: number): TrendsResult {
    const { userId } = useAuth();
    // Include today: N days ending today.
    const startDate = subtractDays(now(), days - 1);
    const endDate = nowAsDate();
    const selectedDays = getDaysBetween(startDate, endDate);

    const { data: trends, isLoading: trendsLoading } = useQuery({
        queryKey: ["trends", days],
        queryFn: () => fetchTrendsData(supabase, userId, selectedDays),
    });
    const { data: settings, isLoading: settingsLoading } = useSettings();

    if (trendsLoading || settingsLoading || !settings || !trends) {
        return { isLoading: true, chartData: [] };
    }

    const total = sumFoodValues(trends);
    const count = trends.length || 1;
    const average: FoodValue = {
        calories: total.calories / count,
        proteins: total.proteins / count,
        fats: total.fats / count,
        carbs: total.carbs / count,
    };

    // `fetchTrendsData` maps over `selectedDays` in order, so index i aligns with
    // that day. We take the ISO day for labels (its own `date` field is misformatted).
    const chartData: DailyTrend[] = trends.map((t, i) => ({
        day: selectedDays[i],
        calories: t.calories,
        proteins: t.proteins,
        fats: t.fats,
        carbs: t.carbs,
    }));

    return {
        isLoading: false,
        chartData,
        average,
        goal: settings,
    };
}
