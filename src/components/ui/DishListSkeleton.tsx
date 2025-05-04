import { Fragment } from "react";
import { FoodValue } from "@/components/food-value.tsx";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { Separator } from "@/components/ui/separator.tsx";

export default function DishListSkeleton() {
  const mockDishes = Array(10).fill(0);

  return (
    <>
      <Separator />

      {mockDishes.map((_, index) => (
        <Fragment key={index}>
          <div className="px-2 py-4">
            <div className="is-flex-grow-1">
              <div className="is-flex is-align-items-center">
                <div className="is-flex-grow-1">
                  <DishTitle isLoading />
                  <div className="subtitle is-7">
                    <span className="is-flex is-justify-content-space-between">
                      <span>
                        <FoodValue isLoading />
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Separator />
        </Fragment>
      ))}
    </>
  );
}
