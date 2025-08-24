import { Fragment, useState } from "react";
import { Dish } from "@/types/dish";
import { DishListSkeleton } from "@/components/ui/dish-list-skeleton.tsx";
import { ContextMenu, ContextMenuItem } from "@/components/ui/context-menu.tsx";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useCopyDish } from "@/hooks/use-copy-dish";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteDish } from "@/hooks/use-delete-dish";
import { SHARED_COLLECTION_ID } from "@/constants";
import { Separator } from "@/components/ui/separator.tsx";
import { DishListItem } from "@/features/dishes/components/dish-list-item.tsx";
import { LucideCopy, LucideTrash } from "lucide-react";

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
                onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dishes"] }),
            });
        }
    };
    const handleDelete = (dish: Dish | null) => {
        if (dish) {
            if (!window.confirm("Please confirm you want to delete this record.")) {
                return;
            }
            deleteDish.mutate(dish.id, {
                onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dishes"] }),
            });
        }
    };

    return (
        <>
            {dishes.length === 0 && <p className="mt-3 text-center">Nothing was found.</p>}

            {dishes.map((dish, i) => (
                <Fragment key={dish.id}>
                    <DishListItem
                        dish={dish}
                        active={isOpened && dish.id === clickedDish?.id}
                        onClick={() => onDishClick(dish)}
                        onContextMenu={(e) => handleContextMenu(dish, e)}
                    />

                    {i < dishes.length - 1 && <Separator className="my-1" />}
                </Fragment>
            ))}

            {isOpened && (
                <ContextMenu x={clickLocation.x} y={clickLocation.y}>
                    <ContextMenuItem icon={<LucideCopy />} onClick={() => handleCopy(clickedDish)}>
                        Copy
                    </ContextMenuItem>
                    {clickedDish?.collectionId !== SHARED_COLLECTION_ID && (
                        <ContextMenuItem
                            icon={<LucideTrash />}
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
