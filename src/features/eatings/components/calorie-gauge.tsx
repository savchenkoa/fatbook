import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme.tsx";

type Props = {
    consumed: number;
    goal: number;
    className?: string;
};

export function CalorieGauge({ consumed, goal, className }: Props) {
    const { theme } = useTheme();
    
    // Calculate remaining calories (goal - consumed)
    const remaining = Math.max(0, goal - consumed);
    const consumedAdjusted = Math.max(0, consumed);

    // Data for the pie chart
    const data = [
        { name: "consumed", value: consumedAdjusted },
        { name: "remaining", value: remaining },
    ];

    // Calculate percentage for styling
    const percentage = goal > 0 ? (consumedAdjusted / goal) * 100 : 0;
    const isOverGoal = percentage > 100;

    // Color based on progress
    const getProgressColor = () => {
        if (percentage <= 85) return "#22c55e"; // green-500
        if (percentage <= 100) return "#eab308"; // yellow-500
        return "#ef4444"; // red-500
    };

    // Get background color based on theme
    const getRemainingColor = () => {
        const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        return isDark ? "#374151" : "#e5e7eb"; // gray-700 for dark, gray-200 for light
    };

    const COLORS = [getProgressColor(), getRemainingColor()]; // consumed color + theme-aware gray for remaining

    return (
        <div className={cn("relative flex flex-col items-center", className)}>
            <div className="relative">
                <ResponsiveContainer width={175} height={175}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
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
                            "text-2xl font-bold",
                            isOverGoal ? "text-red-600 dark:text-red-400" : "text-foreground",
                        )}
                    >
                        {Math.round(consumed)}
                    </div>
                    <div className="text-sm text-muted-foreground">/ {Math.round(goal)} kcal</div>
                </div>
            </div>

            {/* Progress percentage display */}
            <div className="mt-2 hidden text-center sm:block">
                <div
                    className={cn(
                        "text-sm font-medium",
                        isOverGoal ? "text-red-600 dark:text-red-400" : "text-foreground",
                    )}
                >
                    {Math.round(percentage)}% {isOverGoal ? "over goal" : "of goal"}
                </div>
            </div>
        </div>
    );
}
