import { DishPortion } from "@/types/dish-portion";
import { Fragment, useState } from "react";
import { DishListSkeleton } from "@/components/ui/dish-list-skeleton.tsx";
import { isNil } from "@/utils/is-nil.ts";
import { EditDishPortionListItem } from "@/features/dish-portions-form/components/edit-dish-portion-list-item.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { PortionSizeSelector } from "@/features/dish-portions-form/components/portion-size-selector.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";

interface Props {
    dishPortions?: DishPortion[];
    hideFoodValue?: boolean;
    onSave: (portion: DishPortion) => void;
    onDelete: (portion: DishPortion) => void;
    isLoading?: boolean;
    disabled?: boolean;
}

export function EditDishPortionsForm({
    dishPortions,
    hideFoodValue,
    onSave,
    onDelete,
    isLoading,
    disabled,
}: Props) {
    const [selectedPortion, setSelectedPortion] = useState<DishPortion | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    if (isLoading) {
        return <DishListSkeleton />;
    }

    if (isNil(dishPortions) || dishPortions.length === 0) {
        return <EmptyState message="No food recorded" />;
    }

    const handlePortionClick = (portion: DishPortion) => {
        setSelectedPortion(portion);
        setDrawerOpen(true);
    };
    const handleDrawerClose = () => setDrawerOpen(false);

    return (
        <>
            {dishPortions.map((dishPortion, i) => (
                <Fragment key={dishPortion.id}>
                    <EditDishPortionListItem
                        disabled={disabled}
                        hideFoodValue={hideFoodValue}
                        dishPortion={dishPortion}
                        onClick={() => handlePortionClick(dishPortion)}
                    />

                    {i !== dishPortions.length - 1 && <Separator className="my-1" />}
                </Fragment>
            ))}

            <PortionSizeSelector
                isEditing
                open={drawerOpen}
                dishPortion={selectedPortion}
                onClose={handleDrawerClose}
                onSubmit={onSave}
                onDelete={onDelete}
            />
        </>
    );
}
