import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { FoodValue } from "@fatbook/shared";
import { MacroGauge } from "./MacroGauge";
import { AppText } from "./AppText";

interface Props {
    current?: FoodValue | null;
    goals?: FoodValue | null;
    isLoading?: boolean;
}

const PROTEIN_COLOR = "#5B9CF6";
const FAT_COLOR = "#F5B942";
const CARBS_COLOR = "#4ECDC4";

export function NutritionSummary({ current, goals, isLoading }: Props) {
    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const kcal = current?.calories ?? 0;
    const goalKcal = goals?.calories ?? 0;

    return (
        <View style={styles.container}>
            <AppText style={styles.kcalValue}>{Math.round(kcal)}</AppText>
            <AppText style={styles.kcalGoal}>/ {Math.round(goalKcal)} kcal</AppText>

            <View style={styles.gaugesRow}>
                <View style={[styles.gaugeCard, styles.gaugeCardLeft]}>
                    <MacroGauge
                        label="Protein"
                        current={current?.proteins ?? 0}
                        goal={goals?.proteins ?? 0}
                        color={PROTEIN_COLOR}
                    />
                </View>
                <View style={[styles.gaugeCard, styles.gaugeCardCenter]}>
                    <MacroGauge
                        label="Fat"
                        current={current?.fats ?? 0}
                        goal={goals?.fats ?? 0}
                        color={FAT_COLOR}
                    />
                </View>
                <View style={[styles.gaugeCard, styles.gaugeCardRight]}>
                    <MacroGauge
                        label="Carbs"
                        current={current?.carbs ?? 0}
                        goal={goals?.carbs ?? 0}
                        color={CARBS_COLOR}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 20,
        alignItems: "center",
    },
    centered: {
        minHeight: 200,
        justifyContent: "center",
    },
    kcalValue: {
        fontSize: 80.5,
        color: "#111827",
        lineHeight: 80.5,
    },
    kcalGoal: {
        fontSize: 16,
        color: "#9CA3AF",
        marginBottom: 20,
    },
    gaugesRow: {
        flexDirection: "row",
        gap: 2,
        width: "100%",
    },
    gaugeCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        alignItems: "center",
    },
    gaugeCardLeft: {
        borderTopLeftRadius: 32,
        borderBottomLeftRadius: 32,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    gaugeCardCenter: {
        borderRadius: 8,
    },
    gaugeCardRight: {
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderTopRightRadius: 32,
        borderBottomRightRadius: 32,
    },
});
