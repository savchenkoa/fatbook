import { EatingSubmission } from "@fatbook/api-client/go";
import { calculateFoodValue, sumFoodValues } from "@fatbook/shared";
import type { DailyEatings, DishPortion, MealType } from "@fatbook/shared";
import type { MobileData } from "./types";

type Draft = {
    day: string;
    meal: MealType;
    portion: DishPortion;
    submission: EatingSubmission;
};

export class EatingDrafts {
    private readonly drafts = new Map<string, Draft>();

    constructor(private readonly uuid: () => string) {}

    pending(day: string, meal: MealType): DishPortion[] {
        return [...this.drafts.values()]
            .filter((draft) => draft.day === day && draft.meal === meal)
            .map((draft) => draft.portion);
    }

    async save(
        data: MobileData,
        day: string,
        meal: MealType,
        portion: DishPortion,
    ): Promise<DishPortion> {
        const key = `${day}:${meal}:${portion.dish.id}`;
        const previous = this.drafts.get(key);
        const draft: Draft = {
            day,
            meal,
            portion: {
                ...portion,
                ...calculateFoodValue(portion),
                id: undefined,
                selected: false,
            },
            submission: previous?.submission ?? new EatingSubmission(this.uuid),
        };
        this.drafts.set(key, draft);
        const result = await draft.submission.save(
            {
                createEating: (request) =>
                    data.createEating(
                        request.day,
                        request.meal,
                        { ...portion, portion: request.portion },
                        request.clientRequestId,
                    ),
            },
            { day, meal, dishId: portion.dish.id, portion: portion.portion! },
        );
        if (this.drafts.get(key) === draft) this.drafts.delete(key);
        return result;
    }
}

export function confirmEating(
    daily: DailyEatings,
    meal: MealType,
    input: DishPortion,
    response: DishPortion | void,
): DailyEatings {
    const previous = daily.meals[meal].eatings;
    // Повтор POST возвращает исходный DTO; прочитанная запись уже может быть новее.
    const eatings = response
        ? previous.some((item) => item.id === response.id)
            ? previous.map((item) =>
                  item.id === response.id && input.id != null ? response : item,
              )
            : [...previous, response]
        : previous.filter((item) => item.id !== input.id);
    const meals = {
        ...daily.meals,
        [meal]: { ...sumFoodValues(eatings), eatings },
    };
    return { ...daily, ...sumFoodValues(Object.values(meals)), meals };
}
