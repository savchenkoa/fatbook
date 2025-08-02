import { FormState } from "@/hooks/use-enhanced-action-state.ts";
import { saveSettings } from "@/services/settings-service.ts";
import { toNumber } from "@/utils/form-data.utils.ts";

export async function saveSettingsAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = formData.get("userId") as string;
  const userSettings = {
    calories: toNumber(formData.get("calories")) ?? 0,
    proteins: toNumber(formData.get("proteins")) ?? 0,
    fats: toNumber(formData.get("fats")) ?? 0,
    carbs: toNumber(formData.get("carbs")) ?? 0,
  };

  try {
    await saveSettings(userId, userSettings);
    return {
      success: true,
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      updatedAt: Date.now(),
      error: "Could not save settings",
    };
  }
}
