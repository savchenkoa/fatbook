import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchDish } from "@/services/dishes-service.ts";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";
import { useState } from "react";
import { DishDropdownActions } from "@/features/dish/components/dish-dropdown-actions.tsx";
import { EditDishForm } from "@/features/dish/components/edit-dish-form.tsx";
import { FormStatusIndicator } from "@/features/dish/components/form-status-indicator.tsx";
import invariant from "tiny-invariant";
import { EditDishFormSkeleton } from "@/features/dish/components/edit-dish-form-skeleton.tsx";
import { Ingredients } from "@/features/dish/components/ingredients.tsx";
import { SHARED_COLLECTION_ID } from "@/constants.ts";
import { SharedDishBanner } from "@/components/ui/shared-dish-banner.tsx";
import { Button } from "@/components/ui/button";
import { LucideInfo } from "lucide-react";

export function EditDishPage() {
    const params = useParams();
    invariant(params.id, "Error: dishId is required!");
    const dishId = +params.id;
    const location = useLocation();
    const navigate = useNavigate();
    const [formState, setFormState] = useState({
        isPending: false,
        success: false,
        error: "",
    });
    const [showBanner, setShowBanner] = useState(false);
    const { data: dish, isLoading } = useQuery({
        queryKey: ["dish", dishId],
        queryFn: () => fetchDish(dishId),
    });

    const backUrl = location.state?.backRoute ? location.state.backRoute : "/dishes";
    const isDishShared = dish?.collectionId === SHARED_COLLECTION_ID;

    if (!isLoading && !dish) {
        navigate("/not-found");
        return null;
    }

    return (
        <AppLayout>
            <HeaderBox
                title={
                    <span className="flex items-center gap-2">
                        {isDishShared ? "View Dish" : "Edit Dish"}
                        <FormStatusIndicator {...formState} />
                    </span>
                }
                backRoute={backUrl}
                action={
                    <div className="flex gap-2">
                        {dish && isDishShared && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowBanner(true)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                <LucideInfo className="size-4" />
                            </Button>
                        )}
                        {dish && <DishDropdownActions dish={dish} />}
                    </div>
                }
            >
                {!isLoading && dish && isDishShared && (
                    <SharedDishBanner 
                        dish={dish} 
                        forceShow={showBanner}
                        onForceClose={() => setShowBanner(false)}
                    />
                )}

                {!isLoading && dish ? (
                    <EditDishForm dish={dish} onFormStatusChange={setFormState} />
                ) : (
                    <EditDishFormSkeleton />
                )}
            </HeaderBox>

            {!isLoading && dish && <Ingredients dish={dish} />}
        </AppLayout>
    );
}
