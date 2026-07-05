import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { copyDish, deleteDish, fetchDish } from "@fatbook/api-client";
import { formatDate } from "@fatbook/shared";
import type { Dish } from "@fatbook/shared";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { ListItem } from "../components/ListItem";
import { Sheet } from "../components/Sheet";
import { useAuth } from "../context/auth";
import { colors, radius, spacing } from "../theme";
import { supabase } from "../lib/supabase";
import { SHARED_COLLECTION_ID } from "../constants";
import { getDishIcon } from "../utils/dish-icon";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

// Registered both under HomeStack (from MealDetail) and DishesStack (from the dishes list),
// so it's typed against the minimal param list it actually needs rather than either full stack.
type DishDetailStackParamList = {
    DishDetail: { dishId: number };
    EditDish: { dishId?: number } | undefined;
    AddIngredients: { dishId: number };
};

type Props = NativeStackScreenProps<DishDetailStackParamList, "DishDetail">;
type NavProp = NativeStackNavigationProp<DishDetailStackParamList, "DishDetail">;

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

function MacroTile({
    icon,
    color,
    label,
    value,
}: {
    icon: MaterialIconName;
    color: string;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.tile}>
            <View style={[styles.tileIcon, { backgroundColor: color }]}>
                <MaterialCommunityIcons name={icon} size={18} color={colors.onBrand} />
            </View>
            <View style={styles.tileText}>
                <AppText style={styles.tileLabel}>{label}</AppText>
                <AppText weight="bold" style={styles.tileValue}>{value}</AppText>
            </View>
        </View>
    );
}

export function DishDetailScreen({ route }: Props) {
    const { dishId } = route.params;
    const navigation = useNavigation<NavProp>();
    const queryClient = useQueryClient();
    const { userCollectionId } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirm, setConfirm] = useState<null | "clone" | "delete">(null);

    const { data: dish, isLoading } = useQuery({
        queryKey: ["dish", dishId],
        queryFn: () => fetchDish(supabase, dishId),
    });

    const copyMutation = useMutation({
        mutationFn: (original: Dish) => copyDish(supabase, original, userCollectionId),
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ["dishes"] });
            if (created) {
                navigation.navigate("DishDetail", { dishId: created.id });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteDish(supabase, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dishes"] });
            navigation.goBack();
        },
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <ActivityIndicator style={styles.loader} />
            </SafeAreaView>
        );
    }

    if (!dish) {
        return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <AppText style={styles.notFoundText}>Dish not found</AppText>
            </SafeAreaView>
        );
    }

    const isDishShared = dish.collectionId === SHARED_COLLECTION_ID;
    const hasIngredients = dish.ingredients.length > 0;

    // Figma tiles show values for one serving, not per 100 g.
    const serving = dish.defaultPortion ?? 100;
    const scale = serving / 100;
    const perServing = (value: number) => Math.round(value * scale);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                    hitSlop={HIT_SLOP}
                >
                    <Ionicons name="chevron-back" size={22} color={colors.text.strong} />
                </TouchableOpacity>
                <AppText weight="bold" style={styles.headerTitle} numberOfLines={2}>
                    {dish.name}
                </AppText>
                <TouchableOpacity
                    onPress={() => setMenuOpen(true)}
                    style={styles.headerButton}
                    hitSlop={HIT_SLOP}
                    accessibilityLabel="actions"
                >
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.text.strong} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.tiles}>
                    <MacroTile
                        icon="flash"
                        color={colors.brand}
                        label="Calories"
                        value={`${perServing(dish.calories)} kcal`}
                    />
                    <MacroTile
                        icon="water"
                        color={colors.macro.protein}
                        label="Proteins"
                        value={`${perServing(dish.proteins)} g`}
                    />
                    <MacroTile
                        icon="cupcake"
                        color={colors.macro.fat}
                        label="Fats"
                        value={`${perServing(dish.fats)} g`}
                    />
                    <MacroTile
                        icon="leaf"
                        color={colors.macro.carbs}
                        label="Carbs"
                        value={`${perServing(dish.carbs)} g`}
                    />
                </View>

                <View style={styles.servingCard}>
                    <AppText style={styles.servingLabel}>Serving size:</AppText>
                    <AppText weight="bold" style={styles.servingValue}>{serving} g</AppText>
                </View>

                <AppText weight="bold" style={styles.sectionTitle}>
                    Ingredients {hasIngredients ? `(${dish.ingredients.length})` : ""}
                </AppText>

                {hasIngredients ? (
                    <View style={styles.ingredients}>
                        {dish.ingredients.map((ingredient) => (
                            <ListItem
                                key={ingredient.dish.id}
                                leading={getDishIcon(ingredient.dish)}
                                title={ingredient.dish.name ?? ""}
                                subtitle={`${Math.round(ingredient.calories)} kcal${ingredient.portion != null ? `, ${ingredient.portion} g` : ""}`}
                                macros={{
                                    proteins: ingredient.proteins,
                                    fats: ingredient.fats,
                                    carbs: ingredient.carbs,
                                }}
                                trailing="none"
                            />
                        ))}
                    </View>
                ) : (
                    <AppText style={styles.emptyText}>No ingredients</AppText>
                )}
            </ScrollView>

            {!isDishShared && (
                <View style={styles.footer}>
                    <Button
                        title="Add ingredients"
                        variant="primary"
                        size="lg"
                        fullWidth
                        onPress={() => navigation.navigate("AddIngredients", { dishId: dish.id })}
                    />
                </View>
            )}

            <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
                {!isDishShared && (
                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => {
                            setMenuOpen(false);
                            navigation.navigate("EditDish", { dishId: dish.id });
                        }}
                    >
                        <Ionicons name="create-outline" size={20} color={colors.text.strong} />
                        <AppText style={styles.menuLabel}>Edit</AppText>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.menuRow}
                    onPress={() => {
                        setMenuOpen(false);
                        setConfirm("clone");
                    }}
                >
                    <Ionicons name="copy-outline" size={20} color={colors.text.strong} />
                    <AppText style={styles.menuLabel}>Clone</AppText>
                </TouchableOpacity>
                {!isDishShared && (
                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => {
                            setMenuOpen(false);
                            setConfirm("delete");
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                        <AppText style={[styles.menuLabel, { color: colors.destructive }]}>Delete</AppText>
                    </TouchableOpacity>
                )}
                <View style={styles.menuDates}>
                    <AppText style={styles.menuDate}>
                        Created: {formatDate(dish.createdAt, "DD MMM YYYY")}
                    </AppText>
                    <AppText style={styles.menuDate}>
                        Updated: {formatDate(dish.updatedAt, "DD MMM YYYY")}
                    </AppText>
                </View>
            </Sheet>

            <ConfirmSheet
                visible={confirm === "clone"}
                title="Clone dish"
                message="Create a copy of this dish?"
                confirmLabel="Clone"
                onConfirm={() => {
                    setConfirm(null);
                    copyMutation.mutate(dish);
                }}
                onCancel={() => setConfirm(null)}
            />

            <ConfirmSheet
                visible={confirm === "delete"}
                title="Delete dish"
                message="Are you sure you want to delete this dish?"
                confirmLabel="Delete"
                destructive
                onConfirm={() => {
                    setConfirm(null);
                    deleteMutation.mutate(dish.id);
                }}
                onCancel={() => setConfirm(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.screen,
    },
    loader: {
        marginTop: spacing["3xl"],
    },
    notFoundText: {
        textAlign: "center",
        color: colors.text.muted,
        marginTop: spacing["3xl"],
        fontSize: 15,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        gap: spacing.md,
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        color: colors.text.primary,
        textAlign: "center",
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing["2xl"],
    },
    tiles: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    tile: {
        flexGrow: 1,
        flexBasis: "47%",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.surface.card,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    tileIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    tileText: {
        flex: 1,
    },
    tileLabel: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    tileValue: {
        fontSize: 16,
        color: colors.text.primary,
    },
    servingCard: {
        backgroundColor: colors.surface.card,
        borderRadius: radius.md,
        padding: spacing.lg,
        alignItems: "center",
        marginBottom: spacing["2xl"],
    },
    servingLabel: {
        fontSize: 13,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    servingValue: {
        fontSize: 22,
        color: colors.text.primary,
    },
    sectionTitle: {
        fontSize: 17,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    ingredients: {
        gap: spacing.sm,
    },
    emptyText: {
        textAlign: "center",
        color: colors.text.muted,
        paddingVertical: spacing["2xl"],
        fontSize: 14,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    menuRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
    },
    menuLabel: {
        fontSize: 16,
        color: colors.text.primary,
    },
    menuDates: {
        marginTop: spacing.sm,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: 2,
    },
    menuDate: {
        fontSize: 12,
        color: colors.text.muted,
    },
});
