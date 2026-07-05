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
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";
import { MacroRow } from "./MacroRow";

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
                <Ionicons name="search" size={18} color={colors.text.muted} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search dish"
                    placeholderTextColor={colors.text.muted}
                    style={styles.input}
                    returnKeyType="search"
                    autoCorrect={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery("")} hitSlop={HIT_SLOP}>
                        <Ionicons name="close-circle" size={18} color={colors.text.muted} />
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
                                <AppText style={styles.calories}>
                                    {Math.round(item.calories)} kcal
                                </AppText>
                                <MacroRow
                                    proteins={item.proteins}
                                    fats={item.fats}
                                    carbs={item.carbs}
                                    style={styles.macros}
                                />
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
        gap: spacing.sm,
        backgroundColor: colors.surface.subtle,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        height: 44,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.text.primary,
    },
    loader: {
        marginTop: spacing["3xl"],
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing["2xl"],
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
    },
    icon: {
        fontSize: 24,
        width: 32,
        textAlign: "center",
        marginRight: spacing.md,
    },
    rowText: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        color: colors.text.primary,
        marginBottom: 4,
    },
    calories: {
        fontSize: 12,
        color: colors.text.secondary,
        marginBottom: 4,
    },
    macros: {
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: colors.surface.subtle,
    },
    emptyText: {
        textAlign: "center",
        color: colors.text.muted,
        paddingVertical: spacing["3xl"],
        fontSize: 15,
    },
    footerLoader: {
        marginTop: 16,
    },
});
