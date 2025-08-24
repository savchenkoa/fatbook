import { cn } from "@/lib/utils.ts";
import { InlineEdit } from "@/components/ui/inline-edit.tsx";

const NUTRITIONAL_INFO_FIELDS = [
    {
        field: "calories",
        icon: "⚡",
        className: "from-amber-50/10 to-amber-100 border-amber-300",
    },
    {
        field: "proteins",
        icon: "🥩",
        className: "from-pink-50/10 to-pink-100 border-pink-300",
    },
    {
        field: "fats",
        icon: "🧈",
        className: "from-violet-50/10 to-violet-100 border-violet-300",
    },
    {
        field: "carbs",
        icon: "🍚",
        className: "from-emerald-50/10 to-emerald-100 border-emerald-300",
    },
] as const;

type Props = {
    name: (typeof NUTRITIONAL_INFO_FIELDS)[number]["field"];
    value?: number | null;
    onSubmit?: () => void;
};

export function NutritionInput({ name, value, onSubmit }: Props) {
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
            />
            {/* TODO: prefix icon for mobile */}
            <div className="mt-2 hidden text-center text-sm text-gray-500 sm:block">
                <span className="mr-1">{icon}</span>
                <span className="uppercase">{field}</span>
            </div>
        </label>
    );
}
