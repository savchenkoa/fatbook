import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";

export function EditDishFormSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-[75px_1fr] grid-rows-2 gap-1 md:grid-cols-[100px_1fr]">
        <div className="size-100px row-span-2 mr-3">
          {/* Icon selector*/}
          <Skeleton className="h-24 w-24" />
        </div>
        {/* Name input */}
        <Skeleton className="h-10 w-full" />
        <div className="flex items-baseline gap-1 px-2 py-1 text-sm text-slate-500">
          {/* Serving size input */}
          <Skeleton className="h-5 w-40" />
        </div>
      </div>

      {/* Nutrition info inputs */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {(["calories", "proteins", "fats", "carbs"] as const).map(() => (
          <Skeleton className="h-[107px] w-full" />
        ))}
      </div>

      <Button variant="outline" disabled className="mt-4 w-full">
        Scan Nutrition Value
      </Button>
    </div>
  );
}
