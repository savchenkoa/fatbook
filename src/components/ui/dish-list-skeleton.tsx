import { Fragment } from "react";
import { FoodValue } from "@/components/food-value.tsx";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { Separator } from "@/components/ui/separator.tsx";

export function DishListSkeleton() {
  const mockDishes = Array(10).fill(0);

  return (
    <>
      {mockDishes.map((_, index) => (
        <Fragment key={index}>
          <div className="h-[80px] p-4">
            <DishTitle isLoading />
            <div>
              <FoodValue isLoading />
            </div>
          </div>
          <Separator />
        </Fragment>
      ))}
    </>
  );
}
