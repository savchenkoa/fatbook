import { ReactNode } from "react";
import DishIcon from "@/components/dish/DishIcon";
import { Dish } from "@/types/dish";
import { SimplifiedDish } from "@/types/dish-portion";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type Props = {
  dish?: Dish | SimplifiedDish;
  isLoading?: boolean;
  children?: ReactNode;
};

export function DishTitle({ dish, isLoading, children }: Props) {
  const renderedName = dish?.name || "<No Name>";

  if (isLoading) {
    return (
      <div className="mb-2 flex items-center">
        <Skeleton className="mr-2 size-[27px]" />
        <Skeleton className="h-[18px] w-[200px]" />
      </div>
    );
  }

  return (
    <div className="mb-2 flex items-center">
      <DishIcon className="mr-2" dish={dish} />
      <p className="grow select-none">{renderedName}</p>
      {children}
    </div>
  );
}
