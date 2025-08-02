import { useState } from "react";
import { Dish } from "@/types/dish";
import {
  calculateDishValuePer100g,
  sumFoodValues,
} from "@/utils/food-value-utils";
import { useDishMutations } from "../hooks/use-dish-mutations";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LucideCheck, LucideChefHat } from "lucide-react";
import { Spinner } from "@/components/ui/spinner.tsx";
import { FoodValue } from "@/components/ui/food-value.tsx";
import { FoodWeight } from "@/components/ui/food-weight";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { toNumber } from "@/utils/form-data.utils.ts";

type Props = {
  dish: Dish;
  disabled: boolean;
  buttonClassName?: string;
};

export function CookingDetails({ dish, buttonClassName, disabled }: Props) {
  const [cookedWeight, setCookedWeight] = useState(
    dish.cookedWeight ?? undefined,
  );
  const { updateDish } = useDishMutations(dish.id);

  const updateFoodValue = (formData: FormData) => {
    const cookedWeight = toNumber(formData.get("cookedWeight"));
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className={buttonClassName}>
          Cooked <LucideChefHat />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-[2%] translate-y-0 p-3 sm:top-[50%] sm:max-w-[425px] sm:translate-y-[-50%] sm:p-8">
        <DialogHeader>
          <DialogTitle className="flex gap-2">
            Cooked <LucideChefHat />
          </DialogTitle>
          <DialogDescription>
            Enter cooked weight to re-calculate food value.
          </DialogDescription>
        </DialogHeader>
        <div>
          <p className="mb-1">🍗 Cooked:</p>
          <div className="flex flex-wrap justify-between gap-3">
            <FoodValue value={dish} className="text-accent-foreground" />
            <FoodWeight value={null} />
          </div>

          <p className="mt-6 mb-2">🥩 Raw:</p>
          <div className="flex flex-wrap justify-between gap-3">
            <FoodValue
              value={raw100gFoodValue}
              className="text-accent-foreground"
            />
            <FoodWeight value={null} />
          </div>

          <p className="mt-6 mb-2">🥩 Raw Total:</p>
          <div className="flex flex-wrap justify-between gap-3">
            <FoodValue
              value={rawTotalFoodValue}
              className="text-accent-foreground"
            />
            <FoodWeight value={rawTotalWeight} />
          </div>

          <Separator className="my-4" />

          <form action={updateFoodValue}>
            <div>
              <Label htmlFor="cooked-weight-input" className="mb-2">
                Cooked Weight (g.)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="cooked-weight-input"
                  type="number"
                  name="cookedWeight"
                  value={cookedWeight}
                  onChange={(e) => setCookedWeight(toNumber(e.target.value))}
                  placeholder="gramms"
                  className="bg-white"
                  disabled={disabled}
                  min={0}
                />
                {!disabled && (
                  <Button size="icon" disabled={updateDish.isPending}>
                    <span className="sr-only">Save</span>
                    {updateDish.isPending ? (
                      <Spinner loading />
                    ) : (
                      <LucideCheck />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button variant="outline" className="bg-white">
              Close
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
