import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { DishPortion } from "@fatbook/shared";
import { useData } from "../context/data";
import { useEatingMutations } from "../hooks/use-eating-mutations";
import { PortionEditorModal } from "../components/PortionEditorModal";
import { Meals } from "@fatbook/shared";
import { useDailyEatings } from "../hooks/use-daily-eatings";
import { useSettings } from "../hooks/use-settings";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ListItem } from "../components/ListItem";
import { Section } from "../components/Section";
import { colors, radius, spacing, typography, sizes } from "../theme";
import type { HomeStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "MealDetail">;
type NavProp = NativeStackNavigationProp<HomeStackParamList, "MealDetail">;

type MacroIcon = keyof typeof MaterialCommunityIcons.glyphMap;

function MacroItem({
    icon,
    value,
    label,
    color,
}: {
    icon: MacroIcon;
    value: number;
    label: string;
    color: string;
}) {
    return (
        <View style={styles.macroItem}>
            <View style={[styles.macroIcon, { backgroundColor: color }]}>
                <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={colors.onBrand}
                />
            </View>
            <View>
                <AppText style={styles.macroValue}>{value} g</AppText>
                <AppText style={styles.macroLabel}>{label}</AppText>
            </View>
        </View>
    );
}

export function MealDetailScreen({ route }: Props) {
    const { day, meal } = route.params;
    const navigation = useNavigation<NavProp>();
    const {
        data: dailyEatings,
        isLoading,
        isError,
        refetch,
    } = useDailyEatings(day);
    const { data: settings } = useSettings();
    const mealData = dailyEatings?.meals[meal];
    const eatings = mealData?.eatings ?? [];
    const data = useData();
    const [editing, setEditing] = useState<DishPortion | null>(null);
    const { updateEating, removeEating, isPending } = useEatingMutations(
        day,
        meal,
        mealData?.eatings,
    );
    const mealInfo = Meals[meal];
    const kcal = Math.round(mealData?.calories ?? 0);
    const proteins = Math.round(mealData?.proteins ?? 0);
    const fats = Math.round(mealData?.fats ?? 0);
    const carbs = Math.round(mealData?.carbs ?? 0);
    const goal = Math.round(settings?.calories ?? 0);
    const progress = goal > 0 ? Math.min(kcal / goal, 1) : 0;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {isError && (
                <Button
                    title="Не удалось загрузить дневник. Повторить"
                    variant="secondary"
                    onPress={() => void refetch()}
                />
            )}
            {(dailyEatings || isLoading) && (
                <Section style={styles.topSection}>
                    <Card style={styles.headerCard}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialCommunityIcons
                                name="chevron-left"
                                size={26}
                                color={colors.text.strong}
                            />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <AppText style={styles.mealTitle}>
                                {mealInfo.title}
                            </AppText>
                            <View style={styles.progressRow}>
                                <View style={styles.progressTrack}>
                                    {progress > 0 && (
                                        <View
                                            style={[
                                                styles.progressFill,
                                                {
                                                    width: `${Math.round(progress * 100)}%`,
                                                },
                                            ]}
                                        />
                                    )}
                                </View>
                                <AppText style={styles.headerKcal}>
                                    {kcal}
                                    <AppText style={styles.headerKcalGoal}>
                                        {" "}
                                        / {goal} kcal
                                    </AppText>
                                </AppText>
                            </View>
                        </View>
                    </Card>

                    <Card style={styles.macroCard}>
                        <MacroItem
                            icon="food-drumstick-outline"
                            value={proteins}
                            label="Protein"
                            color={colors.macro.protein}
                        />
                        <View style={styles.macroDivider} />
                        <MacroItem
                            icon="peanut-outline"
                            value={fats}
                            label="Fat"
                            color={colors.macro.fat}
                        />
                        <View style={styles.macroDivider} />
                        <MacroItem
                            icon="bread-slice-outline"
                            value={carbs}
                            label="Carbs"
                            color={colors.macro.carbs}
                        />
                    </Card>
                </Section>
            )}

            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {!dailyEatings ? (
                    <AppText style={styles.emptyText}>
                        {isLoading ? "Загрузка…" : "Дневник недоступен"}
                    </AppText>
                ) : eatings.length === 0 ? (
                    <AppText style={styles.emptyText}>Нет блюд</AppText>
                ) : (
                    <Section>
                        {eatings.map((eating) => (
                            <ListItem
                                key={eating.id ?? `${meal}-${eating.dish.id}`}
                                title={eating.dish.name ?? ""}
                                subtitle={`${Math.round(eating.calories)} kcal${eating.portion != null ? `, ${eating.portion} g` : ""}`}
                                macros={{
                                    proteins: eating.proteins,
                                    fats: eating.fats,
                                    carbs: eating.carbs,
                                }}
                                onPress={() => {
                                    if (isPending) return;
                                    if (data.features.atomicRecipes)
                                        setEditing(eating);
                                    else
                                        navigation.navigate("DishDetail", {
                                            dishId: eating.dish.id,
                                        });
                                }}
                            />
                        ))}
                    </Section>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Add dishes"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isPending || !dailyEatings}
                    onPress={() =>
                        navigation.navigate("AddEating", { day, meal })
                    }
                />
            </View>
            <PortionEditorModal
                visible={editing !== null}
                dishPortion={editing}
                isEditing
                onClose={() => setEditing(null)}
                onSubmit={(portion) => updateEating.mutateAsync(portion)}
                onDelete={(portion) => removeEating.mutateAsync(portion)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.screen,
    },
    topSection: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    headerCard: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        width: sizes.compactControl,
        height: sizes.compactControl,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        marginRight: sizes.compactControl, // balance the back button so the title stays centered
    },
    mealTitle: {
        fontSize: typography.title.size,
        color: colors.text.primary,
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    progressTrack: {
        width: sizes.progressWidth,
        height: sizes.progressHeight,
        backgroundColor: colors.surface.track,
        borderRadius: radius.full,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.brand,
        borderRadius: radius.full,
    },
    headerKcal: {
        fontSize: typography.body.size,
        color: colors.text.primary,
    },
    headerKcalGoal: {
        color: colors.text.muted,
    },
    macroCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 0,
    },
    macroItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
    },
    macroIcon: {
        width: sizes.compactControl,
        height: sizes.compactControl,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    macroValue: {
        fontSize: typography.body.size,
        color: colors.text.primary,
    },
    macroLabel: {
        fontSize: typography.caption.size,
        color: colors.text.secondary,
    },
    macroDivider: {
        width: sizes.hairline,
        height: sizes.macroDivider,
        alignSelf: "center",
        backgroundColor: colors.text.primary,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    emptyText: {
        textAlign: "center",
        color: colors.text.muted,
        paddingVertical: spacing["3xl"],
        fontSize: typography.body.size,
    },
    footer: {
        backgroundColor: colors.surface.card,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: sizes.hairline,
        borderTopColor: colors.border,
    },
});
