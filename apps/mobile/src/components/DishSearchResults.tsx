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
import { getDishIcon } from "../utils/dish-icon";
import {
    colors,
    radius,
    spacing,
    typography,
    iconSize,
    fontFamily,
} from "../theme";
import { AppText } from "./AppText";
import { ListItem } from "./ListItem";
import { Button } from "./Button";

const HIT_SLOP = {
    top: spacing.sm,
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
};

type SearchDish = Pick<
    Dish,
    | "id"
    | "name"
    | "icon"
    | "hasIngredients"
    | "proteins"
    | "fats"
    | "carbs"
    | "calories"
>;

type Props<T extends SearchDish> = {
    dishes: T[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    query: string;
    setQuery: (query: string) => void;
    fetchNextPage: () => unknown;
    hasNextPage: boolean;
    onSelect: (dish: T) => void;
    onRetry?: () => void;
    maxQueryLength?: number;
};

export function DishSearchResults<T extends SearchDish>({
    dishes,
    isLoading,
    isFetching,
    isError,
    query,
    setQuery,
    fetchNextPage,
    hasNextPage,
    onSelect,
    onRetry,
    maxQueryLength,
}: Props<T>) {
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetching) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetching, fetchNextPage]);

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <Ionicons
                    name="search"
                    size={iconSize}
                    color={colors.text.muted}
                />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search dish"
                    placeholderTextColor={colors.text.muted}
                    style={styles.input}
                    returnKeyType="search"
                    autoCorrect={false}
                    maxLength={maxQueryLength}
                />
                {query.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setQuery("")}
                        hitSlop={HIT_SLOP}
                    >
                        <Ionicons
                            name="close-circle"
                            size={iconSize}
                            color={colors.text.muted}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {isError && onRetry && (
                <View style={styles.error}>
                    <AppText>Не удалось загрузить блюда.</AppText>
                    <Button
                        title="Повторить"
                        variant="secondary"
                        onPress={onRetry}
                    />
                </View>
            )}
            {isLoading ? (
                <ActivityIndicator style={styles.loader} />
            ) : (
                <FlatList
                    data={dishes}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => (
                        <View style={styles.separator} />
                    )}
                    renderItem={({ item }) => (
                        <ListItem
                            leading={getDishIcon(item)}
                            title={item.name ?? ""}
                            subtitle={`${Math.round(item.calories)} kcal`}
                            macros={{
                                proteins: item.proteins,
                                fats: item.fats,
                                carbs: item.carbs,
                            }}
                            onPress={() => onSelect(item)}
                        />
                    )}
                    ListEmptyComponent={
                        <AppText style={styles.emptyText}>
                            {isError
                                ? "Search failed, try again"
                                : "Nothing found"}
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
        minHeight: spacing["2xl"] + spacing.xl,
    },
    input: {
        flex: 1,
        fontSize: typography.body.size,
        lineHeight: typography.body.lineHeight,
        fontFamily: fontFamily.regular,
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
        fontSize: typography.body.size,
        lineHeight: typography.body.lineHeight,
    },
    error: { padding: spacing.lg, gap: spacing.sm },
    footerLoader: {
        marginTop: spacing.lg,
    },
});
