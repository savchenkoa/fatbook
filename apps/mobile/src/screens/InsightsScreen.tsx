import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTrendsData, type DailyTrend } from "../hooks/use-trends-data";
import { NutritionSummary } from "../components/NutritionSummary";
import { AppText } from "../components/AppText";
import { colors, elevation, radius, spacing, typography } from "../theme";

const INTERVALS = [
    { label: "Week", days: 7 },
    { label: "2 Weeks", days: 14 },
    { label: "Month", days: 30 },
] as const;

export function InsightsScreen() {
    const [days, setDays] = useState<number>(7);
    const { chartData, average, goal, isLoading } = useTrendsData(days);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <AppText weight="bold" style={styles.title}>
                    Insights
                </AppText>
                <View style={styles.segmented}>
                    {INTERVALS.map((interval) => {
                        const active = interval.days === days;
                        return (
                            <Pressable
                                key={interval.days}
                                onPress={() => setDays(interval.days)}
                                style={[styles.segment, active && styles.segmentActive]}
                            >
                                <AppText
                                    weight="medium"
                                    style={[styles.segmentText, active && styles.segmentTextActive]}
                                >
                                    {interval.label}
                                </AppText>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <AppText weight="medium" style={styles.sectionLabel}>
                    Daily average
                </AppText>
                <NutritionSummary current={average} goals={goal} isLoading={isLoading} />

                <TrendChart
                    title="Calories"
                    data={chartData}
                    valueKey="calories"
                    goal={goal?.calories}
                    unit="kcal"
                    color={colors.brand}
                    isLoading={isLoading}
                />
                <TrendChart
                    title="Protein"
                    data={chartData}
                    valueKey="proteins"
                    goal={goal?.proteins}
                    unit="g"
                    color={colors.macro.protein}
                    isLoading={isLoading}
                />
                <TrendChart
                    title="Fat"
                    data={chartData}
                    valueKey="fats"
                    goal={goal?.fats}
                    unit="g"
                    color={colors.macro.fat}
                    isLoading={isLoading}
                />
                <TrendChart
                    title="Carbs"
                    data={chartData}
                    valueKey="carbs"
                    goal={goal?.carbs}
                    unit="g"
                    color={colors.macro.carbs}
                    isLoading={isLoading}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const CHART_HEIGHT = 150;

/** "2026-06-29" → "29" for a compact X-axis tick. */
function dayOfMonth(isoDay: string): string {
    return String(Number(isoDay.slice(8, 10)));
}

type MetricKey = "calories" | "proteins" | "fats" | "carbs";

interface TrendChartProps {
    title: string;
    data: DailyTrend[];
    valueKey: MetricKey;
    goal?: number;
    unit: string;
    color: string;
    isLoading?: boolean;
}

/**
 * Daily bar chart for a single metric with a dashed goal line. The portion of
 * each bar above the goal is drawn in `destructive` (over-budget days read as
 * red), the rest in `color` — matching the web trend chart's stacked treatment.
 */
function TrendChart({ title, data, valueKey, goal = 0, unit, color, isLoading }: TrendChartProps) {
    const maxValue = data.reduce((max, d) => Math.max(max, d[valueKey]), 0);
    // Headroom above the goal so the goal line never sits at the very top.
    const scaleMax = Math.max(goal * 1.15, maxValue, 1);
    const scale = (value: number) => (value / scaleMax) * CHART_HEIGHT;

    const labelStep = Math.ceil(data.length / 7);

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <AppText weight="medium" style={styles.chartTitle}>
                    {title}
                </AppText>
                {goal > 0 && (
                    <View style={styles.goalChip}>
                        <Ionicons name="flag-outline" size={13} color={colors.text.muted} />
                        <AppText style={styles.goalChipText}>
                            {Math.round(goal)} {unit} / day
                        </AppText>
                    </View>
                )}
            </View>

            {isLoading ? (
                <View style={styles.chartLoader}>
                    <ActivityIndicator />
                </View>
            ) : (
                <>
                    <View style={styles.plot}>
                        {goal > 0 && <View style={[styles.goalLine, { bottom: scale(goal) }]} />}
                        {data.map((d, index) => {
                            const value = d[valueKey];
                            const normal = Math.min(value, goal || value);
                            const excess = Math.max(0, value - (goal || value));
                            const normalH = scale(normal);
                            const excessH = scale(excess);
                            const empty = value === 0;
                            return (
                                <View key={index} style={styles.barColumn}>
                                    <View style={styles.barWrapper}>
                                        {empty ? (
                                            <View style={styles.barEmpty} />
                                        ) : (
                                            <>
                                                {excessH > 0 && (
                                                    <View
                                                        style={[
                                                            styles.barSegment,
                                                            styles.barTop,
                                                            { height: excessH, backgroundColor: colors.destructive },
                                                        ]}
                                                    />
                                                )}
                                                <View
                                                    style={[
                                                        styles.barSegment,
                                                        excessH === 0 && styles.barTop,
                                                        { height: normalH, backgroundColor: color },
                                                    ]}
                                                />
                                            </>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.labelsRow}>
                        {data.map((d, index) => (
                            <View key={index} style={styles.labelColumn}>
                                <AppText style={styles.labelText}>
                                    {index % labelStep === 0 ? dayOfMonth(d.day) : ""}
                                </AppText>
                            </View>
                        ))}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.screen,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        gap: spacing.md,
    },
    title: {
        fontSize: typography.title.size,
        color: colors.text.primary,
    },
    segmented: {
        flexDirection: "row",
        backgroundColor: colors.surface.subtle,
        borderRadius: radius.md,
        padding: spacing.xs,
        gap: spacing.xs,
    },
    segment: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radius.control,
        alignItems: "center",
    },
    segmentActive: {
        backgroundColor: colors.brand,
    },
    segmentText: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    segmentTextActive: {
        color: colors.onBrand,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingBottom: spacing["2xl"],
    },
    sectionLabel: {
        fontSize: 13,
        color: colors.text.secondary,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    chartCard: {
        backgroundColor: colors.surface.card,
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        borderRadius: radius.card,
        padding: spacing.lg,
        ...elevation.card,
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    chartTitle: {
        fontSize: 16,
        color: colors.text.primary,
    },
    goalChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    goalChipText: {
        fontSize: 12,
        color: colors.text.muted,
    },
    chartLoader: {
        height: CHART_HEIGHT,
        justifyContent: "center",
    },
    plot: {
        height: CHART_HEIGHT,
        flexDirection: "row",
        alignItems: "stretch",
        position: "relative",
    },
    goalLine: {
        position: "absolute",
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderStyle: "dashed",
        borderColor: colors.text.muted,
    },
    barColumn: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
    },
    barWrapper: {
        width: "68%",
        justifyContent: "flex-end",
    },
    barSegment: {
        width: "100%",
    },
    barTop: {
        borderTopLeftRadius: radius.xs,
        borderTopRightRadius: radius.xs,
    },
    barEmpty: {
        height: 2,
        width: "100%",
        borderRadius: radius.full,
        backgroundColor: colors.surface.track,
    },
    labelsRow: {
        flexDirection: "row",
        marginTop: spacing.sm,
    },
    labelColumn: {
        flex: 1,
        alignItems: "center",
    },
    labelText: {
        fontSize: 11,
        color: colors.text.muted,
    },
});
