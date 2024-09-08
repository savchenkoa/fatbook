import { supabase } from "@/services/supabase";
import { UserSettings } from "@/types/settings";
import { isNil } from "@/utils/is-nil";

class SettingsService {
  async fetchSettings(userId: string): Promise<UserSettings> {
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

  async saveSettings(userId: string, userSettings: UserSettings) {
    await supabase.from("settings").upsert({ userId, ...userSettings });
  }
}

export const settingsService = new SettingsService();
