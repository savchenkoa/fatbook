import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { DailyEatings, MealType } from "@fatbook/shared";
import { Meals } from "@fatbook/shared";
import { AppText } from "./AppText";
import { colors, radius, spacing } from "../theme";

const MEAL_ICONS: Record<MealType, keyof typeof MaterialCommunityIcons.glyphMap> = {
    breakfast: "food-croissant",
    lunch: "food",
    dinner: "silverware-fork-knife",
    snack: "cookie-outline",
};

interface Props {
    meal: MealType;
    data: DailyEatings["meals"][MealType] | undefined;
    dailyCalorieGoal: number;
    isFirst?: boolean;
    isLast?: boolean;
    onPress: () => void;
    onAdd: () => void;
}

export function MealCard({ meal, data, dailyCalorieGoal, isFirst, isLast, onPress, onAdd }: Props) {
    const mealInfo = Meals[meal];
    const eatings = data?.eatings ?? [];
    const kcal = Math.round(data?.calories ?? 0);
    const proteins = Math.round(data?.proteins ?? 0);
    const fats = Math.round(data?.fats ?? 0);
    const carbs = Math.round(data?.carbs ?? 0);
    const hasEatings = eatings.length > 0;
    const progress = dailyCalorieGoal > 0 ? Math.min(kcal / dailyCalorieGoal, 1) : 0;

    const borderStyle = {
        borderTopLeftRadius: isFirst ? radius.card : radius.control,
        borderTopRightRadius: isFirst ? radius.card : radius.control,
        borderBottomLeftRadius: isLast ? radius.card : radius.control,
        borderBottomRightRadius: isLast ? radius.card : radius.control,
    };

    return (
        <View style={[styles.card, borderStyle]}>
            <View style={styles.topRow}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={MEAL_ICONS[meal]}
                        size={24}
                        color={colors.text.secondary}
                    />
                </View>

                <View style={styles.content}>
                    <AppText style={styles.mealName}>{mealInfo.title}</AppText>

                    <View style={styles.kcalRow}>
                        <View style={styles.progressTrack}>
                            {progress > 0 && (
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${Math.round(progress * 100)}%` },
                                    ]}
                                />
                            )}
                        </View>
                        <AppText style={styles.kcalText}>{kcal} / {dailyCalorieGoal} kcal</AppText>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={hasEatings ? onPress : onAdd}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                >
                    <View style={styles.actionIcon}>
                        <MaterialCommunityIcons
                            name={hasEatings ? "chevron-right" : "plus"}
                            size={20}
                            color={colors.text.secondary}
                        />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.chips}>
                <View style={styles.chip}>
                    <AppText style={styles.chipText}>
                        Protein: <AppText weight="medium" style={styles.chipBold}>{proteins}g</AppText>
                    </AppText>
                </View>
                <View style={styles.chip}>
                    <AppText style={styles.chipText}>
                        Fat: <AppText weight="medium" style={styles.chipBold}>{fats}g</AppText>
                    </AppText>
                </View>
                <View style={styles.chip}>
                    <AppText style={styles.chipText}>
                        Carbs: <AppText weight="medium" style={styles.chipBold}>{carbs}g</AppText>
                    </AppText>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface.card,
        padding: 14,
        marginHorizontal: spacing.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    content: {
        flex: 1,
    },
    mealName: {
        fontSize: 23,
        color: colors.text.primary,
        marginBottom: 6,
    },
    kcalRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    progressTrack: {
        width: 40,
        height: 8,
        backgroundColor: colors.surface.track,
        borderRadius: radius.control,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.brand,
        borderRadius: 2,
    },
    kcalText: {
        fontSize: 13,
        color: colors.text.muted,
        textAlign: "right",
    },
    chips: {
        flexDirection: "row",
        gap: spacing.xs,
        flexWrap: "wrap",
        marginTop: 10,
    },
    chip: {
        width: 90,
        height: 32,
        backgroundColor: colors.surface.subtle,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        alignItems: "center",
        justifyContent: "center",
    },
    chipText: {
        fontSize: 11,
        color: colors.text.secondary,
    },
    chipBold: {
        color: colors.text.strong,
    },
    actionButton: {
        marginLeft: spacing.sm,
        alignSelf: "center",
    },
    actionIcon: {
        width: 32,
        height: 32,
        borderRadius: radius.md,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
});
