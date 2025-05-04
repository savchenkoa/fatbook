import { Fragment, useState } from "react";
import { DishInfo } from "./dish-info.tsx";
import { Dish } from "@/types/dish";
import { DishListSkeleton } from "@/components/ui/dish-list-skeleton.tsx";
import { ContextMenu, ContextMenuItem } from "@/components/ui/context-menu.tsx";
import { useContextMenu } from "@/hooks/use-context-menu";
import { FaCopy, FaTrash } from "react-icons/fa";
import { useCopyDish } from "@/hooks/use-copy-dish";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteDish } from "@/hooks/use-delete-dish";
import { SHARED_COLLECTION_ID } from "@/constants";
import { Separator } from "@/components/ui/separator.tsx";
import { cn } from "@/lib/utils.ts";

type ListItemProps = {
  dish: Dish;
  active: boolean;
  onClick: (dish: Dish) => void;
  onContextMenu: (e: unknown) => void;
};

function DishListItem({ dish, active, onClick, onContextMenu }: ListItemProps) {
  const [hovered, setHovered] = useState(false);
  const noName = !dish.name;

  const handleClick = () => {
    onClick(dish);
  };

  return (
    <div
      className={cn("cursor-pointer rounded-xl", {
        "bg-accent": hovered,
        "bg-blue-50": active,
        "bg-red-100": noName,
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      onContextMenu={onContextMenu}
    >
      <div className="p-4">
        <DishInfo dish={dish} />
      </div>
    </div>
  );
}

type Props = {
  dishes: Dish[];
  isLoading?: boolean;
  onDishClick: (dish: Dish) => void;
};

export function DishList({ dishes, isLoading, onDishClick }: Props) {
  const queryClient = useQueryClient();
  const { copyDish } = useCopyDish();
  const { deleteDish } = useDeleteDish();
  const { isOpened, clickLocation, openContextMenu } = useContextMenu();
  const [clickedDish, setClickedDish] = useState<Dish | null>(null);

  if (isLoading) {
    return <DishListSkeleton />;
  }

  const handleContextMenu = (dish: Dish, event) => {
    setClickedDish(dish);
    openContextMenu(event);
  };
  const handleCopy = (dish: Dish | null) => {
    if (dish) {
      copyDish.mutate(dish, {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: ["dishes"] }),
      });
    }
  };
  const handleDelete = (dish: Dish | null) => {
    if (dish) {
      if (!window.confirm("Please confirm you want to delete this record.")) {
        return;
      }
      deleteDish.mutate(dish.id, {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: ["dishes"] }),
      });
    }
  };

  return (
    <>
      {dishes.length === 0 && (
        <p className="mt-3 text-center">Nothing was found.</p>
      )}

      {dishes.map((dish, i) => (
        <Fragment key={dish.id}>
          <DishListItem
            dish={dish}
            active={isOpened && dish.id === clickedDish?.id}
            onClick={() => onDishClick(dish)}
            onContextMenu={(e) => handleContextMenu(dish, e)}
          />
          {i < dishes.length - 1 && <Separator />}
        </Fragment>
      ))}

      {isOpened && (
        <ContextMenu x={clickLocation.x} y={clickLocation.y}>
          <ContextMenuItem
            icon={<FaCopy />}
            onClick={() => handleCopy(clickedDish)}
          >
            Copy
          </ContextMenuItem>
          {clickedDish?.collectionId !== SHARED_COLLECTION_ID && (
            <ContextMenuItem
              icon={<FaTrash />}
              onClick={() => handleDelete(clickedDish)}
            >
              Delete
            </ContextMenuItem>
          )}
        </ContextMenu>
      )}
    </>
  );
}
