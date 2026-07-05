import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { fetchDish } from "@fatbook/api-client";
import { AppText } from "../components/AppText";
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
                            <Ionicons name="pencil" size={18} color="#374151" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.macrosCard}>
                    <AppText style={styles.macrosLabel}>КБЖУ на 100 г</AppText>
                    <AppText style={styles.macrosText}>
                        ⚡ {Math.round(dish.calories)} kcal   🥩 {Math.round(dish.proteins)}g{"  "}
                        🧈 {Math.round(dish.fats)}g   🍚 {Math.round(dish.carbs)}g
                    </AppText>
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
                            <Ionicons name="add-circle-outline" size={26} color="#4ADE80" />
                        </TouchableOpacity>
                    )}
                </View>

                {hasIngredients ? (
                    dish.ingredients.map((ingredient) => (
                        <View key={ingredient.dish.id} style={styles.ingredientRow}>
                            <AppText style={styles.ingredientIcon}>{getDishIcon(ingredient.dish)}</AppText>
                            <View style={styles.ingredientText}>
                                <AppText weight="medium" style={styles.ingredientName}>
                                    {ingredient.dish.name}
                                </AppText>
                                <AppText style={styles.ingredientMacros}>
                                    {ingredient.portion != null ? `${ingredient.portion} г   ` : ""}
                                    ⚡ {Math.round(ingredient.calories)} kcal   🥩 {Math.round(ingredient.proteins)}g
                                    {"  "}
                                    🧈 {Math.round(ingredient.fats)}g   🍚 {Math.round(ingredient.carbs)}g
                                </AppText>
                            </View>
                        </View>
                    ))
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
        backgroundColor: "#fff",
    },
    loader: {
        marginTop: 32,
    },
    notFoundText: {
        textAlign: "center",
        color: "#9CA3AF",
        marginTop: 32,
        fontSize: 15,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    icon: {
        fontSize: 32,
        width: 44,
        textAlign: "center",
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    name: {
        fontSize: 19,
        color: "#111827",
        marginBottom: 2,
    },
    portion: {
        fontSize: 13,
        color: "#6B7280",
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    macrosCard: {
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    macrosLabel: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 6,
    },
    macrosText: {
        fontSize: 14,
        color: "#111827",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 17,
        color: "#111827",
    },
    ingredientRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    ingredientIcon: {
        fontSize: 24,
        width: 32,
        textAlign: "center",
        marginRight: 12,
    },
    ingredientText: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 15,
        color: "#111827",
        marginBottom: 2,
    },
    ingredientMacros: {
        fontSize: 12,
        color: "#6B7280",
    },
    emptyText: {
        textAlign: "center",
        color: "#9CA3AF",
        paddingVertical: 24,
        fontSize: 14,
    },
});
