// Smoke-тест: проверяем что типы и утилиты резолвятся из shared-пакетов
import type { FoodValue, Dish, Eating } from '@fatbook/shared';
import { calculateFoodValue, sumFoodValues } from '@fatbook/shared';
import { createSupabaseClient } from '@fatbook/api-client';

export type { FoodValue, Dish, Eating };
export { calculateFoodValue, sumFoodValues, createSupabaseClient };
