import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Meals } from "@fatbook/shared";
import { useDailyEatings } from "../hooks/use-daily-eatings";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { ListItem } from "../components/ListItem";
import { colors, radius, spacing } from "../theme";
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
                <MacroPill label="Protein" value={proteins} color={colors.macro.protein} />
                <View style={styles.macroDivider} />
                <MacroPill label="Fat" value={fats} color={colors.macro.fat} />
                <View style={styles.macroDivider} />
                <MacroPill label="Carbs" value={carbs} color={colors.macro.carbs} />
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {eatings.length === 0 ? (
                    <AppText style={styles.emptyText}>Нет блюд</AppText>
                ) : (
                    <View style={styles.dishes}>
                        {eatings.map((eating) => (
                            <ListItem
                                key={eating.id ?? `${meal}-${eating.dish.id}`}
                                title={eating.dish.name ?? ""}
                                subtitle={`${Math.round(eating.calories)} kcal${eating.portion != null ? `, ${eating.portion}г` : ""}`}
                                macros={{
                                    proteins: eating.proteins,
                                    fats: eating.fats,
                                    carbs: eating.carbs,
                                }}
                                onPress={() => navigation.navigate("DishDetail", { dishId: eating.dish.id })}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <Button
                    title="Add dishes"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={() => navigation.navigate("AddEating", { day, meal })}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.screen,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        paddingTop: spacing.sm,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.surface.track,
        borderRadius: radius.full,
        alignSelf: "center",
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
    backText: {
        fontSize: 24,
        color: colors.text.strong,
        lineHeight: 30,
    },
    headerCenter: {
        marginLeft: spacing.md,
    },
    mealTitle: {
        fontSize: 20,
        color: colors.text.primary,
    },
    kcalText: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    macroRow: {
        flexDirection: "row",
        paddingVertical: spacing.lg,
        backgroundColor: colors.surface.card,
        marginHorizontal: spacing.lg,
        borderRadius: radius.md,
        marginBottom: spacing.lg,
    },
    macroPill: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    macroIconCircle: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    macroIconDot: {
        width: 18,
        height: 18,
        borderRadius: radius.full,
    },
    macroValue: {
        fontSize: 15,
        color: colors.text.primary,
    },
    macroLabel: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    macroDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    list: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    dishes: {
        gap: spacing.sm,
    },
    emptyText: {
        textAlign: "center",
        color: colors.text.muted,
        paddingVertical: spacing["3xl"],
        fontSize: 15,
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
});
