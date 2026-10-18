import type { Dish, DishPortion, DailyEatings } from "@fatbook/shared";
import { formatDate } from "@fatbook/shared";
import type {
    Dish as ApiDish,
    DishSummary,
    GoApi,
    Eating,
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

function mapEating(eating: Eating): DishPortion {
    return {
        id: eating.id,
        portion: eating.portion,
        proteins: eating.proteins,
        fats: eating.fats,
        carbs: eating.carbs,
        calories: eating.calories,
        selected: true,
        dish: {
            ...eating.dishSnapshot,
            // Для истории без действующей ссылки нужен только локальный ключ строки.
            id: eating.dishId ?? -eating.id,
            collectionId: null,
            defaultPortion: null,
            hasIngredients: false,
            createdAt: eating.createdAt,
            updatedAt: eating.updatedAt,
        },
    };
}

export function createGoData(api: GoApi): MobileData {
    return {
        features: {
            atomicRecipes: true,
            diary: true,
            insights: false,
            dishEditing: true,
            dishCopy: false,
            dishDelete: true,
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
        updateRecipe: async (id, body) => {
            const dish = await api.updateRecipe(id, body);
            return mapDish(dish, dish.ingredients);
        },
        fetchSettings: async () => (await api.me()).user.goals,
        createDish: unavailable,
        updateDish: unavailable,
        copyDish: unavailable,
        deleteDish: (id) => api.deleteRecipe(id),
        addIngredient: unavailable,
        updateIngredient: unavailable,
        deleteIngredient: unavailable,
        fetchDailyEatings: async (day): Promise<DailyEatings> => {
            const daily = await api.dailyEatings(formatDate(day, "YYYY-MM-DD"));
            return {
                ...daily,
                meals: {
                    breakfast: {
                        ...daily.meals.breakfast,
                        eatings: daily.meals.breakfast.eatings.map(mapEating),
                    },
                    lunch: {
                        ...daily.meals.lunch,
                        eatings: daily.meals.lunch.eatings.map(mapEating),
                    },
                    dinner: {
                        ...daily.meals.dinner,
                        eatings: daily.meals.dinner.eatings.map(mapEating),
                    },
                    snack: {
                        ...daily.meals.snack,
                        eatings: daily.meals.snack.eatings.map(mapEating),
                    },
                },
            };
        },
        createEating: async (day, meal, portion, clientRequestId) => {
            if (!portion.portion || !clientRequestId)
                throw new Error("Укажите вес и ключ создания порции.");
            return mapEating(
                await api.createEating({
                    day: formatDate(day, "YYYY-MM-DD"),
                    meal,
                    dishId: portion.dish.id,
                    portion: portion.portion,
                    clientRequestId,
                }),
            );
        },
        updateEating: async (portion) => {
            if (!portion.id || !portion.portion)
                throw new Error("Укажите запись и вес порции.");
            return mapEating(
                await api.updateEating(portion.id, portion.portion),
            );
        },
        deleteEating: async (portion) => {
            if (!portion.id) throw new Error("Укажите запись дневника.");
            await api.deleteEating(portion.id);
        },
        saveSettings: unavailable,
        fetchTrendsData: unavailable,
    };
}
