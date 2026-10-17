import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { calculateFoodValue } from "@fatbook/shared";
import type { Dish, DishPortion } from "@fatbook/shared";
import { useData } from "../context/data";
import { useRecipeDraft } from "../context/recipe-draft";

const EMPTY_ARRAY: DishPortion[] = [];

type MutationContext = { previousValue: DishPortion[] };

export function useIngredientMutations(dish: Dish, initialPortions: DishPortion[] = EMPTY_ARRAY, localDraft = false) {
    const queryClient = useQueryClient();
    const data = useData();
    const draft = useRecipeDraft();
    const [selectedPortions, setSelectedPortions] = useState<DishPortion[]>(initialPortions);

    useEffect(() => {
        setSelectedPortions(initialPortions);
    }, [initialPortions]);

    const createOnMutate =
        (optimisticMutation: (portion: DishPortion) => void) =>
        (portion: DishPortion): MutationContext => {
            optimisticMutation(portion);
            return { previousValue: selectedPortions.slice() };
        };

    const onSuccess = (response: DishPortion | void) => {
        if (!data.isCurrentSession()) return;
        queryClient.invalidateQueries({ queryKey: ["dish"] });
        if (response) {
            setSelectedPortions((portions) => {
                const index = portions.findIndex((p) => p.dish.id === response.dish.id);
                if (index === -1) {
                    return portions;
                }
                const next = portions.slice();
                next[index] = response;
                return next;
            });
        }
    };

    // code "23505" means "unique ingredient" violated - handled by the caller (mutate's own onError)
    const onError = (error: unknown, _portion: DishPortion, context?: MutationContext) => {
        const code = (error as { code?: string } | null)?.code;
        if (code !== "23505") {
            Alert.alert("Ошибка", "Не удалось сохранить изменения");
        }
        if (context) {
            setSelectedPortions(context.previousValue);
        }
    };

    const addIngredient = useMutation({
        mutationFn: (ingredient: DishPortion) => localDraft ? Promise.resolve(draft.upsertIngredient(ingredient)) : data.addIngredient(dish, ingredient),
        onMutate: createOnMutate((newIngredient) => {
            const foodValue = calculateFoodValue(newIngredient);
            setSelectedPortions((portions) => [
                ...portions,
                { ...newIngredient, ...foodValue, selected: true },
            ]);
        }),
        onSuccess,
        onError,
    });

    const updateIngredient = useMutation({
        mutationFn: (ingredient: DishPortion) => localDraft ? Promise.resolve(draft.upsertIngredient(ingredient)) : data.updateIngredient(dish, ingredient),
        onMutate: createOnMutate((updatedIngredient) => {
            const foodValue = calculateFoodValue(updatedIngredient);
            setSelectedPortions((portions) =>
                portions.map((p) =>
                    p.dish.id === updatedIngredient.dish.id ? { ...updatedIngredient, ...foodValue } : p,
                ),
            );
        }),
        onSuccess,
        onError,
    });

    const removeIngredient = useMutation({
        mutationFn: (ingredient: DishPortion) => localDraft ? Promise.resolve(draft.removeIngredient(ingredient)) : data.deleteIngredient(dish, ingredient),
        onMutate: createOnMutate((deletedIngredient) => {
            setSelectedPortions((portions) =>
                portions.filter((p) => p.dish.id !== deletedIngredient.dish.id),
            );
        }),
        onSuccess,
        onError,
    });

    return { addIngredient, updateIngredient, removeIngredient, selectedPortions };
}
