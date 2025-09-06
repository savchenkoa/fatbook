import { cn } from "@/lib/utils.ts";
import { InlineEdit } from "@/components/ui/inline-edit.tsx";

const NUTRITIONAL_INFO_FIELDS = [
    {
        field: "calories",
        icon: "⚡",
        className: "from-amber-50/10 to-amber-100 border-amber-300 dark:from-amber-950/10 dark:to-amber-900 dark:border-amber-700",
    },
    {
        field: "proteins",
        icon: "🥩",
        className: "from-pink-50/10 to-pink-100 border-pink-300 dark:from-pink-950/10 dark:to-pink-900 dark:border-pink-700",
    },
    {
        field: "fats",
        icon: "🧈",
        className: "from-violet-50/10 to-violet-100 border-violet-300 dark:from-violet-950/10 dark:to-violet-900 dark:border-violet-700",
    },
    {
        field: "carbs",
        icon: "🍚",
        className: "from-emerald-50/10 to-emerald-100 border-emerald-300 dark:from-emerald-950/10 dark:to-emerald-900 dark:border-emerald-700",
    },
] as const;

type Props = {
    name: (typeof NUTRITIONAL_INFO_FIELDS)[number]["field"];
    value?: number | null;
    onSubmit?: () => void;
    disabled?: boolean;
};

export function NutritionInput({ name, value, onSubmit, disabled }: Props) {
    const { field, icon, className } = NUTRITIONAL_INFO_FIELDS.find(({ field }) => field === name)!;
    const id = `${name}-input`;

    return (
        <label
            key={field}
            htmlFor={id}
            className={cn(
                "cursor-pointer rounded-lg border border-t-6 bg-linear-to-tr p-1 transition-all hover:-translate-y-[2px] hover:shadow-md sm:p-4",
                className,
            )}
        >
            <InlineEdit
                id={id}
                name={field}
                type="number"
                value={value}
                placeholder="0"
                prefix={icon}
                suffix={field === "calories" ? "kcal" : "g"}
                min={0}
                max={9999}
                className="w-full text-center text-xl font-bold"
                onSubmit={onSubmit}
                disabled={disabled}
            />
            {/* TODO: prefix icon for mobile */}
            <div className="text-muted-foreground mt-2 hidden text-center text-sm sm:block">
                <span className="mr-1">{icon}</span>
                <span className="uppercase">{field}</span>
            </div>
        </label>
    );
}
