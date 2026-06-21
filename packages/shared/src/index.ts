export type { Dish } from "./types/dish";
export type { DishPortion, SimplifiedDish } from "./types/dish-portion";
export type { Eating, DailyEatings } from "./types/eating";
export type { FoodValue } from "./types/food-value";
export { Meals } from "./types/meals";
export type { MealType } from "./types/meals";
export type { UserSettings } from "./types/settings";

export {
    calculateFoodValue,
    calculateDishValuePer100g,
    calculateFoodValueForPortion,
    sumFoodValues,
    emptyFoodValue,
} from "./utils/food-value-utils";
export {
    now,
    nowAsDate,
    parse,
    formatDate,
    getNextDay,
    getPrevDay,
    subtractDays,
    isToday,
    isYesterday,
    getDaysBetween,
} from "./utils/date-utils";
export { formatNumber } from "./utils/formatters";
export { isNil } from "./utils/is-nil";
