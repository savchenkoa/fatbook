import { useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { Button } from "@/components/ui/button.tsx";
import { LucideChevronRight } from "lucide-react";
import { useAuth } from "@/context/auth.tsx";
import { useEffect, useRef } from "react";
import { createDishAction } from "@/features/dish/actions/create-dish-action.ts";
import { PhotoCapture } from "@/components/ui/photo-capture.tsx";
import { IconPicker } from "@/components/ui/icon-picker.tsx";
import { InlineEdit } from "@/components/ui/inline-edit.tsx";
import { NutritionInput } from "@/features/dish/components/nutrition-input.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { FoodValue } from "@/types/food-value.ts";
import { useEnhancedActionState } from "@/hooks/use-enhanced-action-state.ts";

export function CreateDishPage() {
    const location = useLocation();
    const { userCollectionId } = useAuth();
    const navigate = useNavigate();
    const [formState, formAction, isPending] = useEnhancedActionState(createDishAction, {});
    const formRef = useRef<HTMLFormElement>(null);
    const backUrl = location.state?.backRoute ? location.state.backRoute : "/dishes";

    useEffect(() => {
        const { success, newDishId, redirectTo } = formState;
        if (success && newDishId) {
            const redirectPath = redirectTo ? `/${redirectTo}` : "";
            navigate(`/dishes/${newDishId}${redirectPath}`);
        }
    }, [formState, navigate]);

    const handlePhotoAnalyzed = (scannedFoodValue: FoodValue) => {
        const form = formRef.current;
        if (form) {
            const { calories, proteins, fats, carbs } = scannedFoodValue;
            form.elements["calories"].value = calories;
            form.elements["proteins"].value = proteins;
            form.elements["fats"].value = fats;
            form.elements["carbs"].value = carbs;
            formRef.current?.requestSubmit();
        }
    };

    return (
        <AppLayout>
            <form ref={formRef} action={formAction}>
                <HeaderBox
                    title={<span className="flex items-center gap-2">New Dish</span>}
                    backRoute={backUrl}
                >
                    <input name="collectionId" type="hidden" value={userCollectionId ?? ""} />
                    <div className="grid grid-cols-[75px_1fr] grid-rows-2 gap-1 md:grid-cols-[100px_1fr]">
                        <div className="size-100px row-span-2 mr-3">
                            <IconPicker />
                        </div>
                        <InlineEdit
                            ariaLabel="Name"
                            name={"name"}
                            placeholder="Click to edit name"
                            className="w-full text-left text-xl font-bold hover:border-slate-300 hover:bg-gray-50"
                        />
                        <div className="flex items-baseline gap-1 px-2 py-1 text-sm text-slate-500">
                            <span>serving size</span>
                            <InlineEdit
                                ariaLabel="Portion Size"
                                name="defaultPortion"
                                type="number"
                                placeholder="N/A"
                                className="max-w-[75px] bg-gray-50 px-2 text-sm hover:border-slate-300"
                                min={1}
                                max={10000}
                            />
                            <span>g.</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {(["calories", "proteins", "fats", "carbs"] as const).map((field) => (
                            <NutritionInput key={field} name={field} />
                        ))}
                    </div>

                    <div className="mt-4">
                        <PhotoCapture onPhotoAnalyzed={handlePhotoAnalyzed} />
                        <Button
                            type="submit"
                            name="redirectTo"
                            value=""
                            disabled={isPending}
                            className="mt-4 w-full"
                        >
                            {isPending ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </HeaderBox>

                <div className="mx-4 sm:mx-6">
                    <div className="mt-4 mb-2 flex items-baseline justify-between">
                        <span className="text-xl">Ingredients</span>
                    </div>

                    <div className="mb-4 flex justify-between">
                        <Button
                            type="submit"
                            name="redirectTo"
                            value="add-ingredients"
                            disabled={isPending}
                            variant="ghost"
                            className={
                                "hover:bg-accent active:bg-accent/80 flex h-auto basis-[47%] items-center justify-between rounded-xl bg-white shadow"
                            }
                        >
                            <span>Add ingredient</span>
                            <Spinner loading={isPending} />
                            <LucideChevronRight />
                        </Button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
