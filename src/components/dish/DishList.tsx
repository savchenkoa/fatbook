import { Fragment, useState } from "react";
import Divider from "../ui/Divider";
import DishInfo from "./DishInfo";
import { Dish } from "@/types/dish";
import DishListSkeleton from "@/components/ui/DishListSkeleton";
import { clsx } from "clsx";
import ContextMenu, { ContextMenuItem } from "@/components/ui/ContextMenu";
import { useContextMenu } from "@/hooks/use-context-menu";
import { FaCopy, FaTrash } from "react-icons/fa";
import { useCopyDish } from "@/hooks/use-copy-dish";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteDish } from "@/hooks/use-delete-dish";
import { SHARED_COLLECTION_ID } from "@/constants";

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
      className={clsx("cursor-pointer", {
        "background-white-ter-use-theme": hovered,
        "background-info-use-theme": active,
        "background-danger-use-theme": noName,
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      onContextMenu={onContextMenu}
    >
      <div className="px-2 py-4">
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

function DishList({ dishes, isLoading, onDishClick }: Props) {
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
      <Divider />

      {dishes.length === 0 && (
        <p className="has-text-centered mt-3">Nothing was found.</p>
      )}

      {dishes.map((dish) => (
        <Fragment key={dish.id}>
          <DishListItem
            dish={dish}
            active={isOpened && dish.id === clickedDish?.id}
            onClick={() => onDishClick(dish)}
            onContextMenu={(e) => handleContextMenu(dish, e)}
          />
          <Divider />
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

export default DishList;
