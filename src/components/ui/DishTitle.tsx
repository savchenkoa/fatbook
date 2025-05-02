import { ReactNode } from "react";
import DishIcon from "@/components/dish/DishIcon";
import { Dish } from "@/types/dish";
import { SimplifiedDish } from "@/types/dish-portion";

const IconSkeleton = () => (
  <span
    className="image is-32x32 is-skeleton mr-2"
    style={{ width: 27, height: 27 }}
  >
    Icon
  </span>
);

const TextSkeleton = () => (
  <p className="subtitle is-skeleton" style={{ height: 18, width: 200 }}>
    Dish Name
  </p>
);

type Props = {
  dish?: Dish | SimplifiedDish;
  isLoading?: boolean;
  children?: ReactNode;
};

export default function DishTitle({ dish, isLoading, children }: Props) {
  const renderedName = dish?.name || "<No Name>";
  const wrapperClass =
    "title has-text-weight-semibold is-6 mb-2 is-flex is-align-items-center";

  if (isLoading) {
    return (
      <div className={wrapperClass}>
        <IconSkeleton />
        <TextSkeleton />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <DishIcon className="mr-2" dish={dish} />
      <p className="is-flex-grow-1 is-unselectable">{renderedName}</p>
      {children}
    </div>
  );
}
