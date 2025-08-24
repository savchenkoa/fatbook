import { DishListSkeleton } from "@/components/ui/dish-list-skeleton.tsx";
import { Box } from "@/components/ui/box.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { AppLayout } from "@/components/layout/app-layout.tsx";
import { HeaderBox } from "@/components/ui/header-box.tsx";

export function AddIngredientsSkeleton() {
    return (
        <AppLayout>
            <HeaderBox className="mb-4">
                <Skeleton className="mb-8 h-[48px]" />
                <Skeleton className="h-[42px]" />
            </HeaderBox>

            <Box>
                <DishListSkeleton />
            </Box>
        </AppLayout>
    );
}
