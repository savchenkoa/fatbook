import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="skeleton"
            className={cn("dark:bg-accent animate-pulse rounded-md bg-slate-200", className)}
            {...props}
        />
    );
}

export { Skeleton };
