import { createDish } from "@/services/dishes-service.ts";
import { toNumber } from "@/features/dish/actions/dish-action.utils.ts";

export type CreateDishState = {
  success?: boolean;
  newDishId?: number;
  redirectTo?: string;
  error?: string;
};

export async function createDishAction(
  _prevState: CreateDishState,
  formData: FormData,
): Promise<CreateDishState> {
  const dishData = {
    name: formData.get("name") as string,
    icon: formData.get("icon") as string,
    collectionId: toNumber(formData.get("collectionId")),
    defaultPortion: toNumber(formData.get("defaultPortion")),
    calories: toNumber(formData.get("calories")),
    proteins: toNumber(formData.get("proteins")),
    fats: toNumber(formData.get("fats")),
    carbs: toNumber(formData.get("carbs")),
  };
  const redirectTo = formData.get("redirectTo") as string;

  if (dishData.name && dishData.name.length > 100) {
    return { success: false, error: "Name must be less than 100 characters" };
  }

  const newDish = await createDish(dishData);

  if (!newDish) {
    return {
      success: false,
      error: "Error creating dish",
    };
  }

  return {
    success: true,
    newDishId: newDish.id,
    redirectTo,
  };
}
