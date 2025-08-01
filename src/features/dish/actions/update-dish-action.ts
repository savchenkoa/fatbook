import { createDish, updateDish } from "@/services/dishes-service.ts";
import { Dish } from "@/types/dish.ts";
import { isNil } from "@/utils/is-nil.ts";
import { toNumber } from "@/features/dish/actions/dish-action.utils.ts";

export type UpdateDishState = {
  success?: boolean;
  error?: string;
  dish: Dish;
};

export async function updateDishAction(
  prevState: UpdateDishState,
  formData: FormData,
): Promise<UpdateDishState> {
  const dishData = {
    id: toNumber(formData.get("id")),
    name: formData.get("name") as string,
    icon: formData.get("icon") as string,
    collectionId: toNumber(formData.get("collectionId")),
    defaultPortion: toNumber(formData.get("defaultPortion")),
    calories: toNumber(formData.get("calories")),
    proteins: toNumber(formData.get("proteins")),
    fats: toNumber(formData.get("fats")),
    carbs: toNumber(formData.get("carbs")),
  };

  // TODO: calculate diff
  if (isSameDish(prevState.dish, dishData)) {
    // No changes detected
    return {
      success: true,
      dish: prevState.dish,
    };
  }

  const errors: Record<string, string> = {};
  if (!dishData.name?.trim()) {
    errors.name = "Name is required";
  }
  if (dishData.name && dishData.name.length > 100) {
    errors.name = "Name must be less than 100 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, dish: prevState.dish, error: errors.name };
  }

  const result = isNil(dishData.id)
    ? await createDish(dishData)
    : await updateDish(dishData.id, dishData);

  if (!result) {
    return {
      success: false,
      error: errors.name,
      dish: prevState.dish,
    };
  }

  return {
    success: true,
    dish: result,
  };
}

function isSameDish(
  a: Partial<Dish> | undefined,
  b: Partial<Dish> | undefined,
) {
  return (
    a?.id === b?.id &&
    a?.name === b?.name &&
    a?.icon === b?.icon &&
    a?.proteins === b?.proteins &&
    a?.fats === b?.fats &&
    a?.carbs === b?.carbs &&
    a?.calories === b?.calories &&
    a?.defaultPortion === b?.defaultPortion
  );
}
