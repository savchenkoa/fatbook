import { DishPortion } from "@/types/dish-portion.ts";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils.ts";
import { DishTitle } from "@/components/ui/dish-title.tsx";
import { FoodValue } from "@/components/ui/food-value.tsx";
import { FoodWeight } from "@/components/ui/food-weight.tsx";

type Props = {
    dishPortion: DishPortion;
    disabled?: boolean;
    hideFoodValue?: boolean;
    onClick: () => void;
};

export function EditDishPortionListItem({ dishPortion, disabled, hideFoodValue, onClick }: Props) {
    const noName = !dishPortion.dish.name;

    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        onClick();
    };

    return (
        <a
            href="#"
            className={cn("", {
                "cursor-pointer": !disabled,
            })}
            onClick={handleClick}
        >
            <div
                className={cn(
                    "hover:bg-accent/60 active:bg-accent relative rounded-xl px-2 py-4 sm:p-4",
                    {
                        "bg-red-200": noName,
                    },
                )}
            >
                <div className="flex items-center justify-between">
                    <DishTitle dish={dishPortion.dish} />
                    {hideFoodValue && <FoodWeight value={dishPortion.portion} />}
                </div>
                {!hideFoodValue && (
                    <div className="mt-2 flex justify-between">
                        <FoodValue value={dishPortion} />
                        <FoodWeight value={dishPortion.portion} />
                    </div>
                )}
            </div>
        </a>
    );
}
