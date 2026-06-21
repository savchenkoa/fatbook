import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { DailyEatings, MealType } from "@fatbook/shared";
import { Meals } from "@fatbook/shared";

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
    onPress: () => void;
    onAdd: () => void;
}

export function MealCard({ meal, data, dailyCalorieGoal, onPress, onAdd }: Props) {
    const mealInfo = Meals[meal];
    const eatings = data?.eatings ?? [];
    const kcal = Math.round(data?.calories ?? 0);
    const proteins = Math.round(data?.proteins ?? 0);
    const fats = Math.round(data?.fats ?? 0);
    const carbs = Math.round(data?.carbs ?? 0);
    const hasEatings = eatings.length > 0;
    const progress = dailyCalorieGoal > 0 ? Math.min(kcal / dailyCalorieGoal, 1) : 0;

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={MEAL_ICONS[meal]}
                        size={22}
                        color="#6B7280"
                    />
                </View>

                <View style={styles.content}>
                    <View style={styles.nameRow}>
                        <Text style={styles.mealName}>{mealInfo.title}</Text>
                        <Text style={styles.kcalText}>{kcal} kcal</Text>
                    </View>
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
                    <View style={styles.chips}>
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>Protein: {proteins}g</Text>
                        </View>
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>Fat: {fats}g</Text>
                        </View>
                        <View style={styles.chip}>
                            <Text style={styles.chipText}>Carbs: {carbs}g</Text>
                        </View>
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
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    nameRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    mealName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    kcalText: {
        fontSize: 12,
        color: "#6B7280",
    },
    progressTrack: {
        height: 3,
        backgroundColor: "#E5E7EB",
        borderRadius: 2,
        marginBottom: 8,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#4ADE80",
        borderRadius: 2,
    },
    chips: {
        flexDirection: "row",
        gap: 4,
        flexWrap: "wrap",
    },
    chip: {
        backgroundColor: "#F3F4F6",
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    chipText: {
        fontSize: 11,
        color: "#6B7280",
    },
    actionButton: {
        marginLeft: 8,
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
