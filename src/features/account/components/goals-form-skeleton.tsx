import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export function GoalsFormSkeleton() {
  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
        {(["proteins", "fats", "carbs", "calories"] as const).map((field) => (
          <div
            key={field}
            className={field === "calories" ? "sm:col-span-3" : ""}
          >
            <span className="mb-2 inline-block text-sm font-medium capitalize select-none">
              {field}
            </span>
            <Skeleton className={"h-[42px] w-full"} />
          </div>
        ))}
      </div>
      <Button disabled className="w-full">
        Save
      </Button>
    </div>
  );
}
