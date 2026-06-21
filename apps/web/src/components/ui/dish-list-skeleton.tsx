import { Fragment } from "react";
import { FoodValue } from "./food-value.tsx";
import { DishTitle } from "./dish-title.tsx";
import { Separator } from "./separator.tsx";

export function DishListSkeleton() {
    const mockDishes = Array(10).fill(0);

    return (
        <>
            {mockDishes.map((_, index) => (
                <Fragment key={index}>
                    <div className="h-[80px] p-4">
                        <DishTitle isLoading />
                        <div className="mt-2">
                            <FoodValue isLoading />
                        </div>
                    </div>
                    <Separator />
                </Fragment>
            ))}
        </>
    );
}
