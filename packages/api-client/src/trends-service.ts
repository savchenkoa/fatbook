import { formatDate } from "@fatbook/shared";
import type { AppSupabaseClient } from "./supabase";

export async function fetchTrendsData(
    supabase: AppSupabaseClient,
    userId: string,
    selectedDays: string[],
) {
    const { data: dbData } = await supabase
        .from("eatings_by_day")
        .select()
        .eq("userId ", userId)
        .throwOnError();

    const data = dbData ?? [];

    return selectedDays.map((day) => {
        const summary = data.find((r) => r.day === day);

        return {
            date: formatDate(day, "DD MMM"),
            calories: Math.round(summary?.calories ?? 0),
            proteins: Math.round(summary?.proteins ?? 0),
            fats: Math.round(summary?.fats ?? 0),
            carbs: Math.round(summary?.carbs ?? 0),
        };
    });
}
