import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { fetchDish } from "@fatbook/api-client";
import type { Dish, DishPortion } from "@fatbook/shared";
import { useState } from "react";
import { AppText } from "../components/AppText";
import { PortionEditorModal } from "../components/PortionEditorModal";
import { useDishesSearch } from "../hooks/use-dishes-search";
import { useIngredientMutations } from "../hooks/use-ingredient-mutations";
import { getDishIcon } from "../utils/dish-icon";
import { supabase } from "../lib/supabase";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type AddIngredientsStackParamList = {
    AddIngredients: { dishId: number };
};

type Props = NativeStackScreenProps<AddIngredientsStackParamList, "AddIngredients">;

function mapDishToPortionInputs(dish: Dish): DishPortion {
    return {
        proteins: dish.proteins,
        fats: dish.fats,
        carbs: dish.carbs,
        calories: dish.calories,
        dish: {
            id: dish.id,
            name: dish.name,
            collectionId: dish.collectionId,
            icon: dish.icon,
            proteins: dish.proteins,
            fats: dish.fats,
            carbs: dish.carbs,
            calories: dish.calories,
            hasIngredients: dish.hasIngredients,
            defaultPortion: dish.defaultPortion,
            updatedAt: dish.updatedAt,
            createdAt: dish.createdAt,
        },
        selected: false,
    };
}

export function AddIngredientsScreen({ route }: Props) {
    const { dishId } = route.params;
    const { data: dish, isLoading: isDishLoading } = useQuery({
        queryKey: ["dish", dishId],
        queryFn: () => fetchDish(supabase, dishId),
    });
    const { dishes, isLoading, isFetching, isError, query, setQuery, fetchNextPage, hasNextPage } =
        useDishesSearch({ filterDishId: dishId });
    const { addIngredient, updateIngredient, removeIngredient, selectedPortions } =
        useIngredientMutations(dish!, dish?.ingredients);
    const [editingPortion, setEditingPortion] = useState<DishPortion | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const dishPortions = dishes.map(mapDishToPortionInputs);
    const selectedIds = selectedPortions.map((p) => p.dish.id);
    const renderedPortions = [
        ...selectedPortions,
        ...dishPortions.filter((p) => !selectedIds.includes(p.dish.id)),
    ];

    const handleAdd = (portion: DishPortion) => {
        addIngredient.mutate(portion, {
            onError: (error) => {
                const code = (error as { code?: string } | null)?.code;
                if (code === "23505") {
                    Alert.alert(
                        "Ингредиент уже добавлен",
                        "Обновить порцию уже добавленного ингредиента?",
                        [
                            { text: "Отмена", style: "cancel" },
                            { text: "Обновить", onPress: () => updateIngredient.mutate(portion) },
                        ],
                    );
                }
            },
        });
    };

    const handleRowPress = (portion: DishPortion) => {
        setEditingPortion(portion);
        setModalVisible(true);
    };

    const handleQuickToggle = (portion: DishPortion) => {
        if (portion.selected) {
            removeIngredient.mutate(portion);
            return;
        }
        if (portion.dish.defaultPortion) {
            handleAdd({ ...portion, portion: portion.dish.defaultPortion });
        } else {
            handleRowPress(portion);
        }
    };

    const handleModalSubmit = (portion: DishPortion) => {
        if (portion.selected) {
            updateIngredient.mutate(portion);
        } else {
            handleAdd(portion);
        }
    };

    const handleEndReached = () => {
        if (hasNextPage && !isFetching) {
            fetchNextPage();
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <AppText weight="medium" style={styles.title}>
                    Ингредиенты {isDishLoading ? "" : `— ${dish?.name ?? ""}`}
                </AppText>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search dish"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    returnKeyType="search"
                    autoCorrect={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery("")} hitSlop={HIT_SLOP}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {isLoading ? (
                <ActivityIndicator style={styles.loader} />
            ) : (
                <FlatList
                    data={renderedPortions}
                    keyExtractor={(item) => String(item.dish.id)}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => handleRowPress(item)}
                            activeOpacity={0.7}
                        >
                            <AppText style={styles.icon}>{getDishIcon(item.dish)}</AppText>
                            <View style={styles.rowText}>
                                <AppText weight="medium" style={styles.name}>{item.dish.name}</AppText>
                                <AppText style={styles.macros}>
                                    ⚡ {Math.round(item.calories)} kcal   🥩 {Math.round(item.proteins)}g{"  "}
                                    🧈 {Math.round(item.fats)}g   🍚 {Math.round(item.carbs)}g
                                    {item.selected ? `   ✏️ ${item.portion}g` : ""}
                                </AppText>
                            </View>
                            <TouchableOpacity
                                style={styles.quickButton}
                                onPress={() => handleQuickToggle(item)}
                                hitSlop={HIT_SLOP}
                            >
                                <Ionicons
                                    name={item.selected ? "checkmark-circle" : "add-circle-outline"}
                                    size={28}
                                    color={item.selected ? "#4ADE80" : "#9CA3AF"}
                                />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <AppText style={styles.emptyText}>
                            {isError ? "Search failed, try again" : "Nothing found"}
                        </AppText>
                    }
                    ListFooterComponent={
                        isFetching && dishes.length > 0 ? (
                            <ActivityIndicator style={styles.footerLoader} />
                        ) : null
                    }
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                />
            )}

            <PortionEditorModal
                visible={modalVisible}
                dishPortion={editingPortion}
                isEditing={editingPortion?.selected}
                onClose={() => setModalVisible(false)}
                onSubmit={handleModalSubmit}
                onDelete={(portion) => removeIngredient.mutate(portion)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 17,
        color: "#111827",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        height: 44,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#111827",
    },
    loader: {
        marginTop: 32,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    icon: {
        fontSize: 24,
        width: 32,
        textAlign: "center",
        marginRight: 12,
    },
    rowText: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        color: "#111827",
        marginBottom: 4,
    },
    macros: {
        fontSize: 12,
        color: "#6B7280",
    },
    quickButton: {
        marginLeft: 8,
    },
    separator: {
        height: 1,
        backgroundColor: "#F3F4F6",
    },
    emptyText: {
        textAlign: "center",
        color: "#9CA3AF",
        paddingVertical: 32,
        fontSize: 15,
    },
    footerLoader: {
        marginTop: 16,
    },
});
