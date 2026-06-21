import { describe, it, expect } from "vitest";
import {
    calculateFoodValue,
    calculateDishValuePer100g,
    calculateFoodValueForPortion,
    sumFoodValues,
    emptyFoodValue,
} from "./food-value-utils";
import { DishPortion } from "@/types/dish-portion.ts";
import { Dish } from "@/types/dish.ts";

describe("Food Value Calculations", () => {
    const testDish: Dish = {
        id: 1,
        name: "Test Dish",
        proteins: 10,
        fats: 5,
        carbs: 20,
        calories: 170,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collectionId: 1,
        icon: null,
        defaultPortion: null,
        hasIngredients: false,
        ingredients: [],
    };

    describe("calculateFoodValue", () => {
        it("should calculate food value for a portion", () => {
            const portion: DishPortion = {
                dish: testDish,
                portion: 150,
                fats: 0,
                calories: 0,
                carbs: 0,
                proteins: 0,
            };
            const result = calculateFoodValue(portion);

            expect(result).toEqual({
                proteins: 15, // 10 * 150 / 100
                fats: 7.5, // 5 * 150 / 100
                carbs: 30, // 20 * 150 / 100
                calories: 255, // 170 * 150 / 100
            });
        });

        it("should return zero values for missing dish or portion", () => {
            expect(calculateFoodValue({} as any)).toEqual(emptyFoodValue());
            expect(calculateFoodValue({ dish: testDish } as any)).toEqual(emptyFoodValue());
            expect(calculateFoodValue({ portion: 100 } as any)).toEqual(emptyFoodValue());
        });
    });

    describe("calculateDishValuePer100g", () => {
        const ingredients: DishPortion[] = [
            {
                dish: testDish,
                portion: 200,
                proteins: 5,
                fats: 2,
                carbs: 10,
                calories: 85,
            },
            {
                dish: testDish,
                portion: 300,
                proteins: 15,
                fats: 8,
                carbs: 30,
                calories: 255,
            },
        ];

        it("should calculate nutritional values per 100g for a dish", () => {
            const result = calculateDishValuePer100g(ingredients);

            // Total: 500g with 20g protein, 10g fat, 40g carbs, 340 calories
            // Per 100g: 4g protein, 2g fat, 8g carbs, 68 calories
            expect(result).toEqual({
                proteins: 4,
                fats: 2,
                carbs: 8,
                calories: 68,
            });
        });

        it("should use provided cooked weight if available", () => {
            const result = calculateDishValuePer100g(ingredients, 250); // 250g cooked weight

            // Total: 250g with 20g protein, 10g fat, 40g carbs, 340 calories
            // Per 100g: 8g protein, 4g fat, 16g carbs, 136 calories
            expect(result).toEqual({
                proteins: 8,
                fats: 4,
                carbs: 16,
                calories: 136,
            });
        });
    });

    describe("calculateFoodValueForPortion", () => {
        it("should calculate food value for a specific portion size", () => {
            const portion = {
                dish: testDish,
                portion: 75,
                fats: 0,
                calories: 0,
                carbs: 0,
                proteins: 0,
            } satisfies DishPortion;
            const result = calculateFoodValueForPortion(portion);

            expect(result).toEqual({
                proteins: 7.5, // 10 * 75 / 100
                fats: 3.75, // 5 * 75 / 100
                carbs: 15, // 20 * 75 / 100
                calories: 127.5, // 170 * 75 / 100
            });
        });

        it("should handle zero portion size", () => {
            const portion: DishPortion = {
                dish: testDish,
                portion: 0,
                fats: 0,
                calories: 0,
                carbs: 0,
                proteins: 0,
            };
            const result = calculateFoodValueForPortion(portion);
            expect(result).toEqual(emptyFoodValue());
        });
    });

    describe("sumFoodValues", () => {
        it("should sum multiple food values correctly", () => {
            const foodValues = [
                { proteins: 10, fats: 5, carbs: 20, calories: 170 },
                { proteins: 5, fats: 2, carbs: 10, calories: 85 },
                { proteins: 15, fats: 8, carbs: 30, calories: 255 },
            ];

            const result = sumFoodValues(foodValues);

            expect(result).toEqual({
                proteins: 30,
                fats: 15,
                carbs: 60,
                calories: 510,
            });
        });

        it("should return zero values for empty array", () => {
            expect(sumFoodValues([])).toEqual(emptyFoodValue());
        });
    });

    describe("emptyFoodValue", () => {
        it("should return a food value object with all zeros", () => {
            expect(emptyFoodValue()).toEqual({
                proteins: 0,
                fats: 0,
                carbs: 0,
                calories: 0,
            });
        });
    });
});
