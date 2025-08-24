export const Meals = {
    breakfast: {
        icon: "🥪",
        title: "Breakfast",
    },
    lunch: {
        icon: "🍔",
        title: "Lunch",
    },
    dinner: {
        icon: "🍗",
        title: "Dinner",
    },
    snack: {
        icon: "🍟",
        title: "Snack",
    },
};

export type MealType = keyof typeof Meals;
