import { cn } from "@/lib/utils";

type MacroType = "carbs" | "protein" | "fat";

const MACRO_COLORS: Record<MacroType, string> = {
    carbs: "#ef4444", // red-500
    protein: "#f97316", // orange-500
    fat: "#3b82f6", // blue-500
};

const MACRO_LABELS: Record<MacroType, string> = {
    protein: "🥩 Protein",
    fat: "🧈 Fat",
    carbs: "🍚 Carbs",
};

type Props = {
    type: MacroType;
    current: number;
    goal: number;
    className?: string;
};

export function MacroProgressBar({ type, current, goal, className }: Props) {
    // Calculate percentage, capped at 100% for the visual bar
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    const isOverGoal = current > goal;

    const primaryColor = MACRO_COLORS[type];

    return (
        <div className={cn("w-full", className)}>
            {/* Label and values row */}
            <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{MACRO_LABELS[type]}</span>
                <div className="flex items-center gap-1">
                    <span
                        className={cn(
                            "text-xs font-semibold",
                            isOverGoal ? "text-red-600 dark:text-red-400" : "text-foreground",
                        )}
                    >
                        {Math.round(current)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ {Math.round(goal)} g</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-muted">
                <div
                    className="h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: isOverGoal ? "#ef4444" : primaryColor, // Red if over goal
                    }}
                />
            </div>
        </div>
    );
}

export type { MacroType };
