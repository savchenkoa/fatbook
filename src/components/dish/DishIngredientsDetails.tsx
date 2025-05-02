import { useEffect } from "react";
import Message from "@/components/ui/Message";
import { FoodValue } from "@/components/food-value.tsx";
import { FoodWeight } from "@/components/food-weight.tsx";
import { Dish } from "@/types/dish";
import {
  calculateDishValuePer100g,
  sumFoodValues,
} from "@/utils/food-value-utils";
import { FaCheck } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDishMutations } from "@/hooks/use-dish-mutations";
import Button from "@/components/ui/Button";
import GroupedFormField from "@/components/ui/GroupedFormField";
import FormField from "@/components/ui/FormField";

type CookedWeightInput = { cookedWeight: number | null };

type Props = {
  visible: boolean;
  setVisible: (value: boolean) => void;
  dish: Dish;
  disabled?: boolean;
};

export const DishIngredientsDetails = ({
  visible,
  setVisible,
  dish,
  disabled,
}: Props) => {
  const { register, reset, getValues, handleSubmit } =
    useForm<CookedWeightInput>();
  const { updateDish } = useDishMutations(dish.id);

  // When ingredients changed, we need to reset cookedWeight value in DB, and reset it in UI.
  useEffect(() => {
    reset({ cookedWeight: dish.cookedWeight });
  }, [dish]);

  if (!visible) {
    return null;
  }

  const recalculateFoodValue = () => {
    const cookedWeight = getValues("cookedWeight");
    if (!cookedWeight) {
      return;
    }
    const newFoodValue = calculateDishValuePer100g(
      dish.ingredients,
      cookedWeight,
    );
    const dishUpdate = { ...newFoodValue, cookedWeight };

    updateDish.mutate(dishUpdate, {
      onSuccess: () => toast.success("Saved!"),
      onError: () =>
        toast.error("Error while saving!", { position: "top-center" }),
    });
  };

  const raw100gFoodValue = calculateDishValuePer100g(dish.ingredients);
  const rawTotalFoodValue = sumFoodValues(dish.ingredients);
  const rawTotalWeight = dish.ingredients.reduce(
    (sum, next) => (sum += next.portion ?? 0),
    0,
  );

  return (
    <Message
      title="Cooking"
      onClose={() => setVisible(!visible)}
      className="mt-2"
      bodyClassName="py-4 px-2"
    >
      <form onSubmit={handleSubmit(recalculateFoodValue)} className="mb-4">
        <GroupedFormField className="is-align-items-end">
          <FormField label="Cooked Weight (g.)" className="is-flex-grow-1">
            <input
              className="input"
              type="number"
              placeholder="gramms"
              disabled={disabled}
              {...register("cookedWeight", { valueAsNumber: true })}
            />
          </FormField>

          {!disabled && (
            <FormField className="mb-3">
              <Button
                icon={<FaCheck />}
                color="info"
                loading={updateDish.isPending}
              ></Button>
            </FormField>
          )}
        </GroupedFormField>
      </form>

      <p className="mb-1">🍗 Cooked:</p>
      <div className="is-flex is-justify-content-space-between has-text-dark">
        <FoodValue value={dish} />
        <FoodWeight value={null} />
      </div>

      <p className="mt-4 mb-2">🥩 Raw:</p>
      <div className="is-flex is-justify-content-space-between has-text-dark">
        <FoodValue value={raw100gFoodValue} />
        <FoodWeight value={null} />
      </div>

      <p className="mt-4 mb-2">🥩 Raw Total:</p>
      <div className="is-flex is-justify-content-space-between has-text-dark">
        <FoodValue value={rawTotalFoodValue} />
        <FoodWeight value={rawTotalWeight} />
      </div>
    </Message>
  );
};
