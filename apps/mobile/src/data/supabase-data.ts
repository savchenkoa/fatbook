import * as service from "@fatbook/api-client";
import { supabase } from "../lib/supabase";
import { SHARED_COLLECTION_ID } from "../constants";
import { unavailable, type MobileData } from "./types";

export function createSupabaseData(
    userId: string,
    collectionId: number | null,
    isCurrentSession: () => boolean,
): MobileData {
    return {
        features: {
            atomicRecipes: false,
            diary: true,
            insights: true,
            dishEditing: true,
            dishCopy: true,
            dishDelete: true,
            goalsEditing: true,
        },
        isCurrentSession,
        isReadOnlyDish: (dish) => dish.collectionId === SHARED_COLLECTION_ID,
        searchDishes: async (search) => {
            const items = await service.searchDishes(supabase, {
                ...search,
                collectionId,
            });
            return { items, hasMore: items.length === service.PAGE_SIZE };
        },
        fetchDish: (id) => service.fetchDish(supabase, id),
        createDish: (values) =>
            service.createDish(supabase, { ...values, collectionId }),
        createRecipe: unavailable,
        updateRecipe: unavailable,
        updateDish: (id, patch) => service.updateDish(supabase, id, patch),
        copyDish: (dish) => service.copyDish(supabase, dish, collectionId),
        deleteDish: async (id) => {
            await service.deleteDish(supabase, id);
        },
        addIngredient: (dish, portion) =>
            service.addIngredient(supabase, dish, portion),
        updateIngredient: (dish, portion) =>
            service.updateIngredient(supabase, dish, portion),
        deleteIngredient: (dish, portion) =>
            service.deleteIngredient(supabase, dish, portion),
        fetchDailyEatings: (day) =>
            service.fetchDailyEatings(supabase, userId, day),
        createEating: (day, meal, portion) =>
            service.createEating(supabase, userId, day, meal, portion),
        updateEating: (portion) => service.updateEating(supabase, portion),
        deleteEating: (portion) => service.deleteEating(supabase, portion),
        fetchSettings: () => service.fetchSettings(supabase, userId),
        saveSettings: (settings) =>
            service.saveSettings(supabase, userId, settings),
        fetchTrendsData: (days) =>
            service.fetchTrendsData(supabase, userId, days),
    };
}
