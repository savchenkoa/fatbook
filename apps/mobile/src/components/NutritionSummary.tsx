import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { FoodValue } from "@fatbook/shared";
import { MacroGauge } from "./MacroGauge";
import { AppText } from "./AppText";
import { colors, radius, spacing } from "../theme";

interface Props {
    current?: FoodValue | null;
    goals?: FoodValue | null;
    isLoading?: boolean;
}

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
                        color={colors.macro.protein}
                    />
                </View>
                <View style={[styles.gaugeCard, styles.gaugeCardCenter]}>
                    <MacroGauge
                        label="Fat"
                        current={current?.fats ?? 0}
                        goal={goals?.fats ?? 0}
                        color={colors.macro.fat}
                    />
                </View>
                <View style={[styles.gaugeCard, styles.gaugeCardRight]}>
                    <MacroGauge
                        label="Carbs"
                        current={current?.carbs ?? 0}
                        goal={goals?.carbs ?? 0}
                        color={colors.macro.carbs}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xl,
        alignItems: "center",
    },
    centered: {
        minHeight: 200,
        justifyContent: "center",
    },
    kcalValue: {
        fontSize: 80.5,
        color: colors.text.primary,
        lineHeight: 80.5,
    },
    kcalGoal: {
        fontSize: 16,
        color: colors.text.muted,
        marginBottom: spacing.xl,
    },
    gaugesRow: {
        flexDirection: "row",
        gap: 2,
        width: "100%",
    },
    gaugeCard: {
        flex: 1,
        backgroundColor: colors.surface.card,
        padding: spacing.lg,
        alignItems: "center",
    },
    gaugeCardLeft: {
        borderTopLeftRadius: radius.card,
        borderBottomLeftRadius: radius.card,
        borderTopRightRadius: radius.control,
        borderBottomRightRadius: radius.control,
    },
    gaugeCardCenter: {
        borderRadius: radius.control,
    },
    gaugeCardRight: {
        borderTopLeftRadius: radius.control,
        borderBottomLeftRadius: radius.control,
        borderTopRightRadius: radius.card,
        borderBottomRightRadius: radius.card,
    },
});
