import { useEffect } from "react";
import { Message } from "@/components/ui/message.tsx";
import { FoodValue } from "@/components/food-value.tsx";
import { FoodWeight } from "@/components/food-weight.tsx";
import { Dish } from "@/types/dish";
import {
  calculateDishValuePer100g,
  sumFoodValues,
} from "@/utils/food-value-utils";
import { FaCheck } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { useDishMutations } from "@/hooks/use-dish-mutations";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import { toast } from "sonner";

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
    >
      <form onSubmit={handleSubmit(recalculateFoodValue)} className="mb-4">
        <div>
          <label
            htmlFor="cooked-weight-input"
            className="text-accent-foreground"
          >
            Cooked Weight (g.)
          </label>
          <div className="flex items-baseline gap-3">
            <Input
              id="cooked-weight-input"
              type="number"
              placeholder="gramms"
              className="mt-2 bg-white"
              disabled={disabled}
              {...register("cookedWeight", { valueAsNumber: true })}
            />
            {!disabled && (
              <Button size="icon" disabled={updateDish.isPending}>
                {updateDish.isPending ? <Spinner loading /> : <FaCheck />}
              </Button>
            )}
          </div>
        </div>
      </form>

      <p className="mb-1">🍗 Cooked:</p>
      <div className="flex flex-wrap justify-between gap-3">
        <FoodValue value={dish} className="text-accent-foreground" />
        <FoodWeight value={null} />
      </div>

      <p className="mt-4 mb-2">🥩 Raw:</p>
      <div className="flex flex-wrap justify-between gap-3">
        <FoodValue
          value={raw100gFoodValue}
          className="text-accent-foreground"
        />
        <FoodWeight value={null} />
      </div>

      <p className="mt-4 mb-2">🥩 Raw Total:</p>
      <div className="flex flex-wrap justify-between gap-3">
        <FoodValue
          value={rawTotalFoodValue}
          className="text-accent-foreground"
        />
        <FoodWeight value={rawTotalWeight} />
      </div>
    </Message>
  );
};
