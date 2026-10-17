import { createContext, useContext, useRef, useState } from "react";
import type { Dish, DishPortion } from "@fatbook/shared";
import {
    calculateDishValuePer100g,
    calculateFoodValue,
    emptyFoodValue,
} from "@fatbook/shared";
import { RecipeSubmission } from "@fatbook/api-client/go";
import type { DishPatch, DishValues } from "../data/types";
import { useData } from "./data";
import { useAuth } from "./auth-context";

function recalculate(dish: Dish): Dish {
    return {
        ...dish,
        hasIngredients: dish.ingredients.length > 0,
        ...(dish.cookedWeight && dish.ingredients.length
            ? calculateDishValuePer100g(dish.ingredients, dish.cookedWeight)
            : emptyFoodValue()),
    };
}
const newSubmission = () =>
    new RecipeSubmission(() => globalThis.expo.uuidv4());
const RecipeContext = createContext<{
    draft: Dish | null;
    saving: boolean;
    start(values: DishValues): void;
    update(patch: DishPatch): void;
    upsertIngredient(portion: DishPortion): DishPortion;
    removeIngredient(portion: DishPortion): void;
    save(): Promise<Dish>;
    reset(): void;
} | null>(null);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
    const data = useData();
    const { userCollectionId } = useAuth();
    const [draft, setDraft] = useState<Dish | null>(null);
    const [saving, setSaving] = useState(false);
    const busy = useRef(false);
    const submission = useRef<RecipeSubmission | null>(null);
    if (!submission.current) submission.current = newSubmission();
    const reset = () => {
        setDraft(null);
        submission.current = newSubmission();
    };
    const start = (values: DishValues) => {
        const timestamp = new Date().toISOString();
        setDraft({
            id: 0,
            name: values.name,
            icon: values.icon,
            defaultPortion: values.defaultPortion,
            collectionId: userCollectionId,
            cookedWeight: null,
            hasIngredients: false,
            ingredients: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            ...emptyFoodValue(),
        });
        submission.current = newSubmission();
    };
    const update = (patch: DishPatch) =>
        setDraft((current) =>
            current
                ? recalculate({
                      ...current,
                      ...patch,
                      proteins: patch.proteins ?? current.proteins,
                      fats: patch.fats ?? current.fats,
                      carbs: patch.carbs ?? current.carbs,
                      calories: patch.calories ?? current.calories,
                  })
                : null,
        );
    const upsertIngredient = (portion: DishPortion) => {
        if (
            !portion.portion ||
            portion.portion <= 0 ||
            !Number.isFinite(portion.portion)
        )
            throw new Error("Укажите положительный вес ингредиента.");
        const next = {
            ...portion,
            ...calculateFoodValue(portion),
            selected: true,
        };
        setDraft((current) =>
            current
                ? recalculate({
                      ...current,
                      ingredients: [
                          ...current.ingredients.filter(
                              (item) => item.dish.id !== portion.dish.id,
                          ),
                          next,
                      ],
                  })
                : null,
        );
        return next;
    };
    const removeIngredient = (portion: DishPortion) =>
        setDraft((current) =>
            current
                ? recalculate({
                      ...current,
                      ingredients: current.ingredients.filter(
                          (item) => item.dish.id !== portion.dish.id,
                      ),
                  })
                : null,
        );
    const save = async () => {
        if (!draft?.cookedWeight || !draft.ingredients.length || busy.current)
            throw new Error("Укажите состав и готовый вес.");
        busy.current = true;
        setSaving(true);
        try {
            const result = await submission.current!.save(
                {
                    createRecipe: ({ clientRequestId, ...body }) =>
                        data.createRecipe(body, clientRequestId),
                },
                {
                    name: draft.name,
                    icon: draft.icon,
                    defaultPortion: draft.defaultPortion,
                    cookedWeight: draft.cookedWeight,
                    ingredients: draft.ingredients.map((item) => ({
                        dishId: item.dish.id,
                        portion: item.portion!,
                    })),
                },
            );
            if (!data.isCurrentSession()) throw new Error("session_changed");
            return result;
        } finally {
            busy.current = false;
            setSaving(false);
        }
    };
    return (
        <RecipeContext.Provider
            value={{
                draft,
                saving,
                start,
                update,
                upsertIngredient,
                removeIngredient,
                save,
                reset,
            }}
        >
            {children}
        </RecipeContext.Provider>
    );
}
export function useRecipeDraft() {
    const context = useContext(RecipeContext);
    if (!context) throw new Error("RecipeProvider is required");
    return context;
}
