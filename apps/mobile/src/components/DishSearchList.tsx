import { useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Dish } from "@fatbook/shared";
import { useDishesSearch } from "../hooks/use-dishes-search";
import { getDishIcon } from "../utils/dish-icon";
import { AppText } from "./AppText";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = {
    filterDishId?: number;
    filterEmpty?: boolean;
    onSelect: (dish: Dish) => void;
};

export function DishSearchList({ filterDishId, filterEmpty, onSelect }: Props) {
    const { dishes, isLoading, isFetching, isError, query, setQuery, fetchNextPage, hasNextPage } =
        useDishesSearch({ filterDishId, filterEmpty });

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetching) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetching, fetchNextPage]);

    return (
        <View style={styles.container}>
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
                    data={dishes}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => onSelect(item)}
                            activeOpacity={0.7}
                        >
                            <AppText style={styles.icon}>{getDishIcon(item)}</AppText>
                            <View style={styles.rowText}>
                                <AppText weight="medium" style={styles.name}>{item.name}</AppText>
                                <AppText style={styles.macros}>
                                    ⚡ {Math.round(item.calories)} kcal   🥩 {Math.round(item.proteins)}g{"  "}
                                    🧈 {Math.round(item.fats)}g   🍚 {Math.round(item.carbs)}g
                                </AppText>
                            </View>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
