import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { DailyEatings, MealType } from "@fatbook/shared";
import { Meals } from "@fatbook/shared";

interface Props {
    meal: MealType;
    data: DailyEatings["meals"][MealType] | undefined;
    isExpanded: boolean;
    onToggle: () => void;
    onAdd: () => void;
}

export function MealSection({ meal, data, isExpanded, onToggle, onAdd }: Props) {
    const mealInfo = Meals[meal];
    const eatings = data?.eatings ?? [];

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
                <Text style={styles.title}>
                    {mealInfo.icon} {mealInfo.title}
                </Text>
                <View style={styles.headerRight}>
                    {eatings.length > 0 && (
                        <Text style={styles.kcalSummary}>{Math.round(data!.calories)} ккал</Text>
                    )}
                    <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.content}>
                    {eatings.length === 0 ? (
                        <Text style={styles.empty}>Нет блюд</Text>
                    ) : (
                        eatings.map((eating) => (
                            <View key={eating.id ?? `${meal}-${eating.dish.id}`} style={styles.dishRow}>
                                <View style={styles.dishInfo}>
                                    <Text style={styles.dishName}>{eating.dish.name}</Text>
                                    {eating.portion != null && (
                                        <Text style={styles.dishPortion}>{eating.portion} г</Text>
                                    )}
                                </View>
                                <Text style={styles.dishKcal}>{Math.round(eating.calories)} ккал</Text>
                            </View>
                        ))
                    )}
                    <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.7}>
                        <Text style={styles.addButtonText}>+ Добавить блюдо</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        marginBottom: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    kcalSummary: {
        fontSize: 14,
        color: "#666",
    },
    chevron: {
        fontSize: 11,
        color: "#aaa",
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    empty: {
        fontSize: 14,
        color: "#aaa",
        paddingVertical: 12,
        textAlign: "center",
    },
    dishRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5",
    },
    dishInfo: {
        flex: 1,
        marginRight: 8,
    },
    dishName: {
        fontSize: 15,
    },
    dishPortion: {
        fontSize: 12,
        color: "#888",
        marginTop: 2,
    },
    dishKcal: {
        fontSize: 14,
        color: "#555",
    },
    addButton: {
        marginTop: 10,
        padding: 10,
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 6,
    },
    addButtonText: {
        fontSize: 14,
        color: "#007aff",
        fontWeight: "500",
    },
});
