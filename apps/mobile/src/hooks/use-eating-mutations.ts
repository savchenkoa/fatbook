import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EatingSubmission } from "@fatbook/api-client/go";
import { Alert } from "react-native";
import { calculateFoodValue } from "@fatbook/shared";
import type { DishPortion, MealType } from "@fatbook/shared";
import { useData } from "../context/data";
import { useAuth } from "../context/auth-context";
import { DAILY_EATINGS_QUERY_KEY } from "./use-daily-eatings";

const EMPTY_ARRAY: DishPortion[] = [];
type MutationContext = { previousValue: DishPortion[] };

function sameEntry(left: DishPortion, right: DishPortion) {
    return left.id != null || right.id != null
        ? left.id === right.id
        : left.dish.id === right.dish.id;
}

export function useEatingMutations(
    day: string,
    meal: MealType,
    portions: DishPortion[] = EMPTY_ARRAY,
) {
    const queryClient = useQueryClient();
    const data = useData();
    const { userId } = useAuth();
    const drafts = useRef(new Map<number, EatingSubmission>());
    const [selectedPortions, setSelectedPortions] =
        useState<DishPortion[]>(portions);

    useEffect(() => {
        setSelectedPortions(portions);
    }, [portions]);

    const createOnMutate =
        (optimisticMutation: (portion: DishPortion) => void) =>
        (portion: DishPortion): MutationContext => {
            const previousValue = selectedPortions.slice();
            optimisticMutation(portion);
            return { previousValue };
        };

    const onSuccess = (response: DishPortion | void, input: DishPortion) => {
        if (!data.isCurrentSession()) return;
        if (response) {
            setSelectedPortions((current) =>
                current.map((item) =>
                    sameEntry(item, input) ? response : item,
                ),
            );
        }
        return queryClient.invalidateQueries({
            queryKey: [DAILY_EATINGS_QUERY_KEY, day, userId],
        });
    };

    const onError = (
        _err: unknown,
        _portion: DishPortion,
        context?: MutationContext,
    ) => {
        if (!data.isCurrentSession()) return;
        Alert.alert(
            "Ошибка",
            "Не удалось сохранить изменения. Повторите попытку.",
        );
        if (context) setSelectedPortions(context.previousValue);
    };

    const addEating = useMutation({
        mutationFn: async (portion: DishPortion) => {
            if (!data.features.atomicRecipes)
                return data.createEating(day, meal, portion);
            let draft = drafts.current.get(portion.dish.id);
            if (!draft) {
                draft = new EatingSubmission(() => globalThis.expo.uuidv4());
                drafts.current.set(portion.dish.id, draft);
            }
            const result = await draft.save(
                {
                    createEating: (request) =>
                        data.createEating(
                            request.day,
                            request.meal,
                            portion,
                            request.clientRequestId,
                        ),
                },
                {
                    day,
                    meal,
                    dishId: portion.dish.id,
                    portion: portion.portion!,
                },
            );
            drafts.current.delete(portion.dish.id);
            return result;
        },
        retry: false,
        onMutate: createOnMutate((portion) => {
            setSelectedPortions((current) => [
                ...current,
                { ...portion, ...calculateFoodValue(portion), selected: true },
            ]);
        }),
        onSuccess,
        onError,
    });

    const updateEating = useMutation({
        mutationFn: (portion: DishPortion) => data.updateEating(portion),
        retry: false,
        onMutate: createOnMutate((portion) => {
            setSelectedPortions((current) =>
                current.map((item) =>
                    sameEntry(item, portion)
                        ? { ...portion, ...calculateFoodValue(portion) }
                        : item,
                ),
            );
        }),
        onSuccess,
        onError,
    });

    const removeEating = useMutation({
        mutationFn: (portion: DishPortion) => data.deleteEating(portion),
        retry: false,
        onMutate: createOnMutate((portion) => {
            setSelectedPortions((current) =>
                current.filter((item) => !sameEntry(item, portion)),
            );
        }),
        onSuccess,
        onError,
    });

    return {
        addEating,
        updateEating,
        removeEating,
        selectedPortions,
        isPending:
            addEating.isPending ||
            updateEating.isPending ||
            removeEating.isPending,
    };
}
