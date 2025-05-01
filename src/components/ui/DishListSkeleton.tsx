import Divider from "@/components/ui/Divider";
import { Fragment } from "react";
import FoodValue from "@/components/FoodValue";
import DishTitle from "@/components/ui/DishTitle";

export default function DishListSkeleton() {
  const mockDishes = Array(10).fill(0);

  return (
    <>
      <Divider />

      {mockDishes.map((_, index) => (
        <Fragment key={index}>
          <div className="px-2 py-4">
            <div className="is-flex-grow-1">
              <div className="is-flex is-align-items-center">
                <div className="is-flex-grow-1">
                  <DishTitle isLoading />
                  <p className="subtitle is-7">
                    <span className="is-flex is-justify-content-space-between">
                      <span>
                        <FoodValue isLoading />
                      </span>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Divider />
        </Fragment>
      ))}
    </>
  );
}
