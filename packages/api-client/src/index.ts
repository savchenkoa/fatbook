export { createSupabaseClient } from "./supabase";
export type { AppSupabaseClient } from "./supabase";

export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "./supabase.types";

export { fetchDish, searchDishes, createDish, copyDish, updateDish, deleteDish, PAGE_SIZE } from "./dishes-service";
export { fetchDailyEatings, createEating, updateEating, deleteEating } from "./eatings-service";
export { addIngredient, updateIngredient, deleteIngredient } from "./ingredients-service";
export { fetchSettings, saveSettings } from "./settings-service";
export { fetchTrendsData } from "./trends-service";
export { setUserMetadata } from "./user-metadata-service";
export type { UserMetadata } from "./user-metadata-service";
