import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { calculateFoodValue } from "@fatbook/shared";
import type { DishPortion, MealType } from "@fatbook/shared";
import {
    createEating as createEatingService,
    deleteEating as deleteEatingService,
    updateEating as updateEatingService,
} from "@fatbook/api-client";
import { useAuth } from "../context/auth";
import { supabase } from "../lib/supabase";
import { DAILY_EATINGS_QUERY_KEY } from "./use-daily-eatings";

const EMPTY_ARRAY: DishPortion[] = [];

type MutationContext = { previousValue: DishPortion[] };

export function useEatingMutations(
    day: string,
    meal: MealType,
    portions: DishPortion[] = EMPTY_ARRAY,
) {
    const queryClient = useQueryClient();
    const { userId } = useAuth();
    const [selectedPortions, setSelectedPortions] = useState<DishPortion[]>(portions);

    useEffect(() => {
        setSelectedPortions(portions);
    }, [portions]);

    const createOnMutate =
        (optimisticMutation: (portion: DishPortion) => void) =>
        (portion: DishPortion): MutationContext => {
            optimisticMutation(portion);
            return { previousValue: selectedPortions.slice() };
        };

    const onSuccess = (response: DishPortion | void) => {
        queryClient.invalidateQueries({ queryKey: [DAILY_EATINGS_QUERY_KEY, day] });
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

    const onError = (_err: unknown, _portion: DishPortion, context?: MutationContext) => {
        Alert.alert("Ошибка", "Не удалось сохранить изменения");
        if (context) {
            setSelectedPortions(context.previousValue);
        }
    };

    const addEating = useMutation({
        mutationFn: (portion: DishPortion) => createEatingService(supabase, userId, day, meal, portion),
        onMutate: createOnMutate((newPortion) => {
            const foodValue = calculateFoodValue(newPortion);
            setSelectedPortions((portions) => [
                ...portions,
                { ...newPortion, ...foodValue, selected: true },
            ]);
        }),
        onSuccess,
        onError,
    });

    const updateEating = useMutation({
        mutationFn: (portion: DishPortion) => updateEatingService(supabase, portion),
        onMutate: createOnMutate((updatedPortion) => {
            const foodValue = calculateFoodValue(updatedPortion);
            setSelectedPortions((portions) =>
                portions.map((p) =>
                    p.dish.id === updatedPortion.dish.id ? { ...updatedPortion, ...foodValue } : p,
                ),
            );
        }),
        onSuccess,
        onError,
    });

    const removeEating = useMutation({
        mutationFn: (portion: DishPortion) => deleteEatingService(supabase, portion),
        onMutate: createOnMutate((deletedPortion) => {
            setSelectedPortions((portions) =>
                portions.filter((p) => p.dish.id !== deletedPortion.dish.id),
            );
        }),
        onSuccess,
        onError,
    });

    return { addEating, updateEating, removeEating, selectedPortions };
}
