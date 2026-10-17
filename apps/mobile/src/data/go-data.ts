import type { Dish, DishPortion } from "@fatbook/shared";
import type {
    Dish as ApiDish,
    DishSummary,
    GoApi,
} from "@fatbook/api-client/go";
import { unavailable, type MobileData } from "./types";

function mapDish(
    dish: DishSummary,
    ingredients: ApiDish["ingredients"] = [],
): Dish {
    return {
        ...dish,
        collectionId: dish.spaceId,
        ingredients: ingredients.map(
            (item): DishPortion => ({
                id: item.id,
                portion: item.portion,
                proteins: item.proteins,
                fats: item.fats,
                carbs: item.carbs,
                calories: item.calories,
                selected: true,
                dish: {
                    ...item.sourceSnapshot,
                    id: item.dishId,
                    collectionId: null,
                    defaultPortion: null,
                    hasIngredients: false,
                    createdAt: dish.createdAt,
                    updatedAt: dish.updatedAt,
                },
            }),
        ),
    };
}

export function createGoData(api: GoApi): MobileData {
    return {
        features: {
            atomicRecipes: true,
            diary: false,
            insights: false,
            dishEditing: false,
            dishCopy: false,
            dishDelete: false,
            goalsEditing: false,
        },
        isCurrentSession: api.captureSession(),
        isReadOnlyDish: (dish) => dish.collectionId === null,
        searchDishes: async ({ scope = "mine", query, page, filterDishId }) => {
            const result = await api.listDishes(scope, query, page);
            return {
                items: result.items
                    .filter((item) => item.id !== filterDishId)
                    .map((item) => mapDish(item)),
                hasMore: result.hasMore,
            };
        },
        fetchDish: async (id) => {
            const dish = await api.dish(id);
            return mapDish(dish, dish.ingredients);
        },
        createRecipe: async (body, clientRequestId) => {
            const dish = await api.createRecipe({ ...body, clientRequestId });
            return mapDish(dish, dish.ingredients);
        },
        fetchSettings: async () => (await api.me()).user.goals,
        createDish: unavailable,
        updateDish: unavailable,
        copyDish: unavailable,
        deleteDish: unavailable,
        addIngredient: unavailable,
        updateIngredient: unavailable,
        deleteIngredient: unavailable,
        fetchDailyEatings: unavailable,
        createEating: unavailable,
        updateEating: unavailable,
        deleteEating: unavailable,
        saveSettings: unavailable,
        fetchTrendsData: unavailable,
    };
}
