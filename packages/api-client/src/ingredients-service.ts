import {
    Dish,
    DishPortion,
    calculateDishValuePer100g,
    calculateFoodValueForPortion,
} from "@fatbook/shared";
import type { AppSupabaseClient } from "./supabase";
import { TablesInsert, TablesUpdate } from "./supabase.types";
import { updateDish } from "./dishes-service";

const SELECT_INGREDIENT_WITH_DISH = `*, dish:dishes!public_dishIngredients_dish_fkey (*)`;

async function updateDishFoodValue(supabase: AppSupabaseClient, dish: Dish) {
    const { data: ingredients } = await supabase
        .from("ingredients")
        .select(`proteins,fats,carbs,calories,portion`)
        .eq("parentDishId", dish.id)
        .returns<DishPortion[]>();

    const dishFoodValue = calculateDishValuePer100g(ingredients ?? []);

    await updateDish(supabase, dish.id, {
        name: dish.name,
        hasIngredients: Boolean(ingredients && ingredients.length > 0),
        cookedWeight: null,
        ...dishFoodValue,
    });
}

export async function addIngredient(
    supabase: AppSupabaseClient,
    dish: Dish,
    inputs: DishPortion,
): Promise<DishPortion> {
    const foodValue = calculateFoodValueForPortion(inputs);
    const newIngredient: TablesInsert<"ingredients"> = {
        portion: inputs.portion ?? 0,
        dishId: inputs.dish.id,
        parentDishId: dish.id,
        ...foodValue,
    };

    const { data: ingredient } = await supabase
        .from("ingredients")
        .insert(newIngredient)
        .select(SELECT_INGREDIENT_WITH_DISH)
        .single<DishPortion>()
        .throwOnError();

    await updateDishFoodValue(supabase, dish);

    return {
        ...ingredient!,
        selected: true,
    };
}

export async function updateIngredient(
    supabase: AppSupabaseClient,
    dish: Dish,
    inputs: DishPortion,
): Promise<DishPortion> {
    const foodValue = calculateFoodValueForPortion(inputs);
    const updatedIngredient: TablesUpdate<"ingredients"> = {
        portion: inputs.portion,
        ...foodValue,
    };

    const { data: ingredient } = await supabase
        .from("ingredients")
        .update(updatedIngredient)
        .eq("dishId", inputs.dish.id)
        .eq("parentDishId", dish.id)
        .select(SELECT_INGREDIENT_WITH_DISH)
        .single<DishPortion>()
        .throwOnError();

    await updateDishFoodValue(supabase, dish);

    return {
        ...ingredient!,
        selected: true,
    };
}

export async function deleteIngredient(
    supabase: AppSupabaseClient,
    dish: Dish,
    inputs: DishPortion,
) {
    await supabase
        .from("ingredients")
        .delete()
        .eq("dishId", inputs.dish.id)
        .eq("parentDishId", dish.id);

    await updateDishFoodValue(supabase, dish);
}
