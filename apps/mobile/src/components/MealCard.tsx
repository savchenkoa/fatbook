import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { DailyEatings, MealType } from "@fatbook/shared";
import { Meals } from "@fatbook/shared";
import { AppText } from "./AppText";

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
        borderTopLeftRadius: isFirst ? 32 : 8,
        borderTopRightRadius: isFirst ? 32 : 8,
        borderBottomLeftRadius: isLast ? 32 : 8,
        borderBottomRightRadius: isLast ? 32 : 8,
    };

    return (
        <View style={[styles.card, borderStyle]}>
            <View style={styles.topRow}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={MEAL_ICONS[meal]}
                        size={24}
                        color="#6B7280"
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
                            color="#6B7280"
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
        backgroundColor: "#fff",
        padding: 14,
        marginHorizontal: 16,
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
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    mealName: {
        fontSize: 23,
        color: "#111827",
        marginBottom: 6,
    },
    kcalRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },
    progressTrack: {
        width: 40,
        height: 8,
        backgroundColor: "#E5E7EB",
        borderRadius: 8,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#4ADE80",
        borderRadius: 2,
    },
    kcalText: {
        fontSize: 13,
        color: "#9CA3AF",
        textAlign: "right",
    },
    chips: {
        flexDirection: "row",
        gap: 4,
        flexWrap: "wrap",
        marginTop: 10,
    },
    chip: {
        width: 90,
        height: 32,
        backgroundColor: "#F3F4F6",
        borderRadius: 32,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    chipText: {
        fontSize: 11,
        color: "#6B7280",
    },
    chipBold: {
        color: "#374151",
    },
    actionButton: {
        marginLeft: 8,
        alignSelf: "center",
    },
    actionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
});
