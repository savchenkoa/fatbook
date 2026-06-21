import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { FoodValue } from "@fatbook/shared";
import { MacroProgressBar } from "./MacroProgressBar";

interface Props {
    current?: FoodValue | null;
    goals?: FoodValue | null;
    isLoading?: boolean;
}

function calorieColor(current: number, goal: number): string {
    if (goal <= 0) return "#22c55e";
    const ratio = current / goal;
    if (ratio <= 0.85) return "#22c55e";
    if (ratio <= 1.0) return "#eab308";
    return "#ef4444";
}

export function NutritionSummary({ current, goals, isLoading }: Props) {
    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator />
            </View>
        );
    }

    const kcal = current?.calories ?? 0;
    const goalKcal = goals?.calories ?? 0;

    return (
        <View style={styles.container}>
            <View style={styles.calorieRow}>
                <Text style={[styles.kcalValue, { color: calorieColor(kcal, goalKcal) }]}>
                    {Math.round(kcal)}
                </Text>
                <Text style={styles.kcalLabel}> / {Math.round(goalKcal)} ккал</Text>
            </View>
            <MacroProgressBar
                label="Белки"
                current={current?.proteins ?? 0}
                goal={goals?.proteins ?? 0}
                color="#f97316"
            />
            <MacroProgressBar
                label="Жиры"
                current={current?.fats ?? 0}
                goal={goals?.fats ?? 0}
                color="#3b82f6"
            />
            <MacroProgressBar
                label="Углеводы"
                current={current?.carbs ?? 0}
                goal={goals?.carbs ?? 0}
                color="#ef4444"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    centered: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 100,
    },
    calorieRow: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: 12,
    },
    kcalValue: {
        fontSize: 32,
        fontWeight: "700",
    },
    kcalLabel: {
        fontSize: 16,
        color: "#666",
    },
});
