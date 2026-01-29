import { InlineEdit } from "@/components/ui/inline-edit.tsx";
import { Dish } from "@/types/dish.ts";
import { updateDishAction } from "@/features/dish/actions/update-dish-action.ts";
import { IconPicker } from "@/components/ui/icon-picker.tsx";
import { PhotoCapture } from "@/components/ui/photo-capture.tsx";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth.tsx";
import { NutritionInput } from "@/features/dish/components/nutrition-input.tsx";
import { formatNumber } from "@/utils/formatters.ts";
import { FoodValue } from "@/types/food-value.ts";
import { flushSync } from "react-dom";
import { useEnhancedActionState } from "@/hooks/use-enhanced-action-state.ts";
import { SHARED_COLLECTION_ID } from "@/constants.ts";

type Props = {
    dish: Dish;
    onFormStatusChange?: (formState: {
        success: boolean;
        error: string;
        isPending: boolean;
    }) => void;
    disabled?: boolean;
};

export function EditDishForm({ dish, onFormStatusChange }: Props) {
    const { userCollectionId } = useAuth();
    const formRef = useRef<HTMLFormElement>(null);
    const [formValues, setFormValues] = useState<Partial<FoodValue>>({});
    const [formState, formAction, isPending] = useEnhancedActionState(updateDishAction, { dish });
    const nutritionInfoFilled = dish.calories && dish.proteins && dish.fats && dish.carbs;
    const isDishShared = dish.collectionId === SHARED_COLLECTION_ID;

    useEffect(() => {
        setFormValues(dish);
    }, [dish]);

    // TODO: move to context
    useEffect(() => {
        onFormStatusChange?.({
            success: formState?.success ?? false,
            error: formState?.error ?? "",
            isPending,
        });
    }, [formState, isPending, onFormStatusChange]);

    const handlePhotoAnalyzed = (scannedFoodValue: FoodValue) => {
        // flushSync to re-render the form with new values before submit
        flushSync(() => {
            setFormValues(scannedFoodValue);
        });
        formRef.current?.requestSubmit();
    };

    return (
        <form ref={formRef} action={formAction}>
            <input name="id" type="hidden" value={dish.id ?? ""} />
            <input name="collectionId" type="hidden" value={userCollectionId ?? ""} />
            <div className="grid grid-cols-[75px_1fr] grid-rows-2 gap-1 md:grid-cols-[100px_1fr]">
                <div className="size-100px row-span-2 mr-3">
                    <IconPicker
                        value={dish.icon}
                        disabled={isDishShared}
                    />
                </div>
                <InlineEdit
                    name="name"
                    ariaLabel="Name"
                    placeholder="Click to edit name"
                    value={dish.name}
                    className="text-foreground hover:border-border hover:bg-accent w-full text-left text-xl font-bold"
                    disabled={isDishShared}
                />
                <div className="text-muted-foreground flex items-baseline gap-1 px-2 py-1 text-sm">
                    <span>serving size</span>
                    <InlineEdit
                        name="defaultPortion"
                        ariaLabel="Portion Size"
                        type="number"
                        placeholder="N/A"
                        value={dish.defaultPortion ?? null}
                        className="bg-accent hover:border-border max-w-[75px] px-2 text-sm"
                        min={1}
                        max={10000}
                        disabled={isDishShared}
                    />
                    <span>g.</span>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
                {(["calories", "proteins", "fats", "carbs"] as const).map((field) => (
                    <NutritionInput
                        key={field}
                        name={field}
                        value={formatNumber(formValues[field])}
                        disabled={isDishShared}
                    />
                ))}
            </div>

            {!nutritionInfoFilled && !isDishShared && (
                <div className="mt-4">
                    <PhotoCapture onPhotoAnalyzed={handlePhotoAnalyzed} />
                </div>
            )}
        </form>
    );
}
