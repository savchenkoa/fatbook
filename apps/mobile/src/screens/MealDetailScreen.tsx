import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Meals } from "@fatbook/shared";
import { useDailyEatings } from "../hooks/use-daily-eatings";
import { AppText } from "../components/AppText";
import type { HomeStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "MealDetail">;
type NavProp = NativeStackNavigationProp<HomeStackParamList, "MealDetail">;

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={styles.macroPill}>
            <View style={[styles.macroIconCircle, { backgroundColor: color + "33" }]}>
                <View style={[styles.macroIconDot, { backgroundColor: color }]} />
            </View>
            <AppText weight="bold" style={styles.macroValue}>{value} г</AppText>
            <AppText style={styles.macroLabel}>{label}</AppText>
        </View>
    );
}

export function MealDetailScreen({ route }: Props) {
    const { day, meal } = route.params;
    const navigation = useNavigation<NavProp>();
    const insets = useSafeAreaInsets();
    const { data: dailyEatings } = useDailyEatings(day);
    const mealData = dailyEatings?.meals[meal];
    const eatings = mealData?.eatings ?? [];
    const mealInfo = Meals[meal];
    const kcal = Math.round(mealData?.calories ?? 0);
    const proteins = Math.round(mealData?.proteins ?? 0);
    const fats = Math.round(mealData?.fats ?? 0);
    const carbs = Math.round(mealData?.carbs ?? 0);

    return (
        <View style={styles.container}>
            <View style={styles.handle} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <AppText style={styles.backText}>‹</AppText>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <AppText weight="bold" style={styles.mealTitle}>{mealInfo.title}</AppText>
                    <AppText weight="medium" style={styles.kcalText}>{kcal} kcal</AppText>
                </View>
            </View>

            <View style={styles.macroRow}>
                <MacroPill label="Protein" value={proteins} color="#5B9CF6" />
                <View style={styles.macroDivider} />
                <MacroPill label="Fat" value={fats} color="#F5B942" />
                <View style={styles.macroDivider} />
                <MacroPill label="Carbs" value={carbs} color="#4ECDC4" />
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {eatings.length === 0 ? (
                    <AppText style={styles.emptyText}>Нет блюд</AppText>
                ) : (
                    eatings.map((eating) => (
                        <View key={eating.id ?? `${meal}-${eating.dish.id}`} style={styles.dishRow}>
                            <View style={styles.dishInfo}>
                                <AppText weight="medium" style={styles.dishName}>{eating.dish.name}</AppText>
                                <AppText style={styles.dishDetails}>
                                    {Math.round(eating.calories)} kcal
                                    {eating.portion != null ? `, ${eating.portion}г` : ""}
                                    {"   "}P: {Math.round(eating.proteins)}г{"  "}
                                    F: {Math.round(eating.fats)}г{"  "}
                                    C: {Math.round(eating.carbs)}г
                                </AppText>
                            </View>
                            <View style={styles.dishArrow}>
                                <AppText style={styles.arrowText}>›</AppText>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate("AddEating", { day, meal })}
                    activeOpacity={0.85}
                >
                    <AppText weight="bold" style={styles.addButtonText}>Add dishes</AppText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: "#D1D5DB",
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    backText: {
        fontSize: 24,
        color: "#374151",
        lineHeight: 30,
    },
    headerCenter: {
        marginLeft: 12,
    },
    mealTitle: {
        fontSize: 20,
        color: "#111827",
    },
    kcalText: {
        fontSize: 14,
        color: "#4ADE80",
    },
    macroRow: {
        flexDirection: "row",
        paddingVertical: 16,
        backgroundColor: "#F9FAFB",
        marginHorizontal: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    macroPill: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    macroIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    macroIconDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    macroValue: {
        fontSize: 15,
        color: "#111827",
    },
    macroLabel: {
        fontSize: 12,
        color: "#6B7280",
    },
    macroDivider: {
        width: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 8,
    },
    list: {
        flex: 1,
        paddingHorizontal: 16,
    },
    dishRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    dishInfo: {
        flex: 1,
        marginRight: 12,
    },
    dishName: {
        fontSize: 16,
        color: "#111827",
        marginBottom: 2,
    },
    dishDetails: {
        fontSize: 13,
        color: "#6B7280",
    },
    dishArrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    arrowText: {
        fontSize: 20,
        color: "#6B7280",
        lineHeight: 24,
    },
    emptyText: {
        textAlign: "center",
        color: "#9CA3AF",
        paddingVertical: 32,
        fontSize: 15,
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    addButton: {
        backgroundColor: "#4ADE80",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
    },
    addButtonText: {
        fontSize: 16,
        color: "#fff",
    },
});
