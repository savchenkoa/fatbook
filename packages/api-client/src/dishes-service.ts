import { Dish, DishPortion, isNil, nowAsDate } from "@fatbook/shared";
import type { AppSupabaseClient } from "./supabase";
import { Tables, TablesInsert, TablesUpdate } from "./supabase.types";
import { addIngredient } from "./ingredients-service";

type DishModel = Omit<Tables<"dishes">, "deleted" | "searchable"> & {
    ingredients?: Tables<"ingredients">[];
};

type SearchProps = {
    query: string;
    collectionId: number | null;
    filterDishId?: number;
    filterEmpty?: boolean;
    page: number;
};

export const PAGE_SIZE = 25;
const SHARED_COLLECTION_ID = 1;

function mapDishToUi(dish: DishModel | null): Dish | null {
    if (isNil(dish)) {
        return null;
    }

    if (isWithIngredients(dish)) {
        dish.ingredients.sort(
            (a: DishPortion, b: DishPortion) => a.dish.name?.localeCompare(b.dish.name!) ?? 0,
        );
        return dish;
    }

    return {
        ...(dish as any),
        ingredients: [],
    };
}

function isWithIngredients(dish: DishModel | Dish | null): dish is Dish {
    return !!(dish as Dish)?.ingredients;
}

export async function fetchDish(
    supabase: AppSupabaseClient,
    id: number,
): Promise<Dish | null> {
    const { data: dish } = await supabase
        .from("dishes")
        .select(
            `
        id,
        name,
        icon,
        proteins,
        fats,
        carbs,
        calories,
        defaultPortion,
        hasIngredients,
        cookedWeight,
        updatedAt,
        createdAt,
        collectionId,
        ingredients!public_dishIngredients_ingredient_fkey (
          *,
          dish:dishes!public_dishIngredients_dish_fkey (*)
        )
     `,
        )
        .eq("id", id)
        .eq("deleted", false)
        .single();

    return mapDishToUi(dish);
}

export async function searchDishes(
    supabase: AppSupabaseClient,
    searchProps: SearchProps,
): Promise<Dish[]> {
    const { query, collectionId, filterDishId } = searchProps;
    if (!query) {
        return searchDishesFallback(supabase, searchProps);
    }

    const { data, error } = await supabase.rpc("search_dishes_pgroonga", {
        search_query: query.trim(),
        user_collection_id: collectionId ?? undefined,
        limit_count: PAGE_SIZE,
    });

    if (error) {
        console.error("PGroonga search error:", error);
        return searchDishesFallback(supabase, searchProps);
    }

    return (data ?? [])
        .filter((dish) => !isNil(dish))
        .filter((dish) => dish.id !== filterDishId)
        .map((d) => mapDishToUi(d) as Dish);
}

async function searchDishesFallback(
    supabase: AppSupabaseClient,
    { query, filterDishId, filterEmpty, collectionId, page }: SearchProps,
): Promise<Dish[]> {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let dbQuery = supabase
        .from("dishes")
        .select()
        .is("deleted", false)
        .range(from, to)
        .order("updatedAt", { ascending: false })
        .order("id", { ascending: true })
        .throwOnError();

    if (query) {
        dbQuery = dbQuery.ilike("name", `%${query.trim()}%`);
    }

    // All users can see SHARED dishes
    const collections = [SHARED_COLLECTION_ID];
    if (collectionId !== null) {
        collections.push(collectionId);
    }
    dbQuery = dbQuery.in("collectionId", collections);

    if (filterEmpty) {
        dbQuery = dbQuery
            .not("proteins", "is", null)
            .not("fats", "is", null)
            .not("carbs", "is", null)
            .not("calories", "is", null);
    }

    if (filterDishId) {
        dbQuery = dbQuery.not("id", "eq", filterDishId);
    }

    const { data } = await dbQuery;

    return (data ?? []).filter((d) => !isNil(d)).map((d) => mapDishToUi(d)) as Dish[];
}

export async function createDish(
    supabase: AppSupabaseClient,
    dish: TablesInsert<"dishes">,
): Promise<Dish | null> {
    const { data } = await supabase.from("dishes").insert(dish).select();
    return data && data[0] ? mapDishToUi(data[0]) : null;
}

export async function copyDish(
    supabase: AppSupabaseClient,
    originalDish: Dish,
    collectionId: number | null,
) {
    const newDish = await createDish(supabase, {
        name: originalDish.name + " (Copy)",
        proteins: originalDish.proteins,
        fats: originalDish.fats,
        carbs: originalDish.carbs,
        calories: originalDish.calories,
        defaultPortion: originalDish.defaultPortion,
        collectionId: collectionId ?? SHARED_COLLECTION_ID,
        icon: originalDish.icon,
        hasIngredients: originalDish.hasIngredients,
    });

    if (newDish && originalDish.hasIngredients && originalDish.ingredients.length > 0) {
        originalDish.ingredients.forEach((ingredient) => {
            addIngredient(supabase, newDish, ingredient);
        });
    }

    return newDish;
}

export async function updateDish(
    supabase: AppSupabaseClient,
    id: number,
    dish: TablesUpdate<"dishes">,
): Promise<Dish | null> {
    const { data } = await supabase
        .from("dishes")
        .update({
            ...dish,
            updatedAt: nowAsDate().toISOString(),
        })
        .eq("id", id)
        .select();

    return data ? mapDishToUi(data[0]) : null;
}

/* Delete will only mark dish as `deleted`.
 * It will be hidden from search, but remain referenced by Eatings/DishIngredients.
 * Housekeeping procedure will delete `deleted` dishes each month, if there are no references left.
 * */
export async function deleteDish(supabase: AppSupabaseClient, id: number) {
    return supabase.from("dishes").update({ deleted: true }).eq("id", id);
}
