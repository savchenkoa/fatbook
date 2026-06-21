import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme.tsx";

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

export function MacroGauge({ type, current, goal, className }: Props) {
    const { theme } = useTheme();

    // Calculate remaining
    const remaining = Math.max(0, goal - current);
    const progress = Math.min(current, goal);

    // Data for the pie chart
    const data = [
        { name: "current", value: progress },
        { name: "remaining", value: remaining },
    ];

    // Calculate percentage for determining if over goal
    const percentage = goal > 0 ? (current / goal) * 100 : 0;
    const isOverGoal = percentage > 100;

    const primaryColor = MACRO_COLORS[type];
    // Get background color based on theme
    const getRemainingColor = () => {
        const isDark =
            theme === "dark" ||
            (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        return isDark ? "#374151" : "#e5e7eb"; // gray-700 for dark, gray-200 for light
    };

    const COLORS = [primaryColor, getRemainingColor()]; // macro color + gray for remaining

    return (
        <div className={cn("flex flex-col items-center", className)}>
            {/* Macro gauge */}
            <div className="relative">
                <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            startAngle={90}
                            endAngle={450}
                            dataKey="value"
                            stroke="none"
                            isAnimationActive={false}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                        className={cn(
                            "text-lg leading-tight font-bold",
                            isOverGoal ? "text-red-600 dark:text-red-400" : "text-foreground",
                        )}
                    >
                        {Math.round(current)}
                    </div>
                    <div className="text-muted-foreground text-xs leading-tight">
                        / {Math.round(goal)} g
                    </div>
                </div>
            </div>

            {/* Label */}
            <div className="mt-1 text-center">
                <div className="text-foreground text-xs font-medium">{MACRO_LABELS[type]}</div>
                {isOverGoal && (
                    <div className="text-xs text-red-500 dark:text-red-400">
                        +{Math.round(current - goal)}g
                    </div>
                )}
            </div>
        </div>
    );
}

export type { MacroType };
