import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { fetchDish } from "@fatbook/api-client";
import { AppText } from "../components/AppText";
import { ListItem } from "../components/ListItem";
import { MacroRow } from "../components/MacroRow";
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

export function DishDetailScreen({ route }: Props) {
    const { dishId } = route.params;
    const navigation = useNavigation<NavProp>();
    const { data: dish, isLoading } = useQuery({
        queryKey: ["dish", dishId],
        queryFn: () => fetchDish(supabase, dishId),
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
                <AppText style={styles.notFoundText}>Блюдо не найдено</AppText>
            </SafeAreaView>
        );
    }

    const isDishShared = dish.collectionId === SHARED_COLLECTION_ID;
    const hasIngredients = dish.ingredients.length > 0;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <AppText style={styles.icon}>{getDishIcon(dish)}</AppText>
                    <View style={styles.headerText}>
                        <AppText weight="medium" style={styles.name}>{dish.name}</AppText>
                        {dish.defaultPortion != null && (
                            <AppText style={styles.portion}>Порция по умолчанию: {dish.defaultPortion} г</AppText>
                        )}
                    </View>
                    {!isDishShared && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate("EditDish", { dishId: dish.id })}
                            hitSlop={HIT_SLOP}
                        >
                            <Ionicons name="pencil" size={18} color={colors.text.strong} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.macrosCard}>
                    <AppText style={styles.macrosLabel}>КБЖУ на 100 г</AppText>
                    <AppText style={styles.macrosCalories}>{Math.round(dish.calories)} kcal</AppText>
                    <MacroRow
                        proteins={dish.proteins}
                        fats={dish.fats}
                        carbs={dish.carbs}
                        style={styles.macrosRow}
                    />
                </View>

                <View style={styles.sectionHeader}>
                    <AppText weight="medium" style={styles.sectionTitle}>
                        Ингредиенты {hasIngredients ? `(${dish.ingredients.length})` : ""}
                    </AppText>
                    {!isDishShared && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate("AddIngredients", { dishId: dish.id })}
                            hitSlop={HIT_SLOP}
                        >
                            <Ionicons name="add-circle-outline" size={26} color={colors.brand} />
                        </TouchableOpacity>
                    )}
                </View>

                {hasIngredients ? (
                    <View style={styles.ingredients}>
                        {dish.ingredients.map((ingredient) => (
                            <ListItem
                                key={ingredient.dish.id}
                                leading={getDishIcon(ingredient.dish)}
                                title={ingredient.dish.name ?? ""}
                                subtitle={`${Math.round(ingredient.calories)} kcal${ingredient.portion != null ? `, ${ingredient.portion} г` : ""}`}
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
                    <AppText style={styles.emptyText}>Нет ингредиентов</AppText>
                )}
            </ScrollView>
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
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing["2xl"],
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    icon: {
        fontSize: 32,
        width: 44,
        textAlign: "center",
        marginRight: spacing.md,
    },
    headerText: {
        flex: 1,
    },
    name: {
        fontSize: 19,
        color: colors.text.primary,
        marginBottom: 2,
    },
    portion: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
    macrosCard: {
        backgroundColor: colors.surface.card,
        borderRadius: radius.md,
        padding: spacing.lg,
        marginBottom: spacing["2xl"],
        gap: 4,
    },
    macrosLabel: {
        fontSize: 13,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    macrosCalories: {
        fontSize: 14,
        color: colors.text.primary,
    },
    macrosRow: {
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: 17,
        color: colors.text.primary,
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
});
