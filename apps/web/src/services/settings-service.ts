import { supabase } from "@/services/supabase";
import { UserSettings, isNil } from "@fatbook/shared";

export async function fetchSettings(userId: string): Promise<UserSettings> {
    const { data } = await supabase
        .from("settings")
        .select(`proteins, fats, carbs, calories`)
        .eq("userId", userId)
        .throwOnError();

    if (isNil(data) || data.length === 0) {
        return {
            proteins: 100,
            fats: 70,
            carbs: 180,
            calories: 2000,
        };
    }

    return data[0];
}

export async function saveSettings(userId: string, userSettings: UserSettings) {
    await supabase.from("settings").upsert({ userId, ...userSettings });
}
