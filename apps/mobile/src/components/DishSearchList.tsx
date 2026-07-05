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
import { ListItem } from "./ListItem";

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
                        <ListItem
                            leading={getDishIcon(item)}
                            title={item.name ?? ""}
                            subtitle={`${Math.round(item.calories)} kcal`}
                            macros={{ proteins: item.proteins, fats: item.fats, carbs: item.carbs }}
                            onPress={() => onSelect(item)}
                        />
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
    separator: {
        height: spacing.sm,
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
