import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Meals } from "@fatbook/shared";
import type { Dish, DishPortion } from "@fatbook/shared";
import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { ListItem } from "../components/ListItem";
import { Section } from "../components/Section";
import { PortionEditorModal } from "../components/PortionEditorModal";
import { useAuth } from "../context/auth";
import { useDailyEatings } from "../hooks/use-daily-eatings";
import { useDishesSearch } from "../hooks/use-dishes-search";
import { useEatingMutations } from "../hooks/use-eating-mutations";
import { colors, radius, spacing, typography } from "../theme";
import type { HomeStackParamList } from "../navigation/types";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Scope = "all" | "mine";
type Position = "single" | "first" | "middle" | "last";

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

function rowPosition(index: number, count: number): Position {
    if (count === 1) return "single";
    if (index === 0) return "first";
    if (index === count - 1) return "last";
    return "middle";
}

type Props = NativeStackScreenProps<HomeStackParamList, "AddEating">;

export function AddEatingScreen({ route, navigation }: Props) {
    const { day, meal } = route.params;
    const mealInfo = Meals[meal];
    const { userCollectionId } = useAuth();
    const { data: dailyEatings } = useDailyEatings(day);
    const { dishes, isLoading, isFetching, isError, query, setQuery, fetchNextPage, hasNextPage } =
        useDishesSearch({ filterEmpty: true });
    const { addEating, updateEating, removeEating, selectedPortions } = useEatingMutations(
        day,
        meal,
        dailyEatings?.meals[meal]?.eatings,
    );
    const [editingPortion, setEditingPortion] = useState<DishPortion | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [scope, setScope] = useState<Scope>("all");

    const isSearching = query.trim().length > 0;

    const dishPortions = dishes.map(mapDishToPortionInputs);
    const selectedIds = selectedPortions.map((p) => p.dish.id);
    const merged = [
        ...selectedPortions,
        ...dishPortions.filter((p) => !selectedIds.includes(p.dish.id)),
    ];
    // Search pages and duplicate seed rows can surface the same dish id twice —
    // keep the first (a selected portion wins over a plain search hit).
    const seen = new Set<number>();
    const deduped = merged.filter((p) => {
        if (seen.has(p.dish.id)) return false;
        seen.add(p.dish.id);
        return true;
    });
    const rendered =
        scope === "mine"
            ? deduped.filter((p) => p.dish.collectionId === userCollectionId)
            : deduped;

    const handleRowPress = (portion: DishPortion) => {
        setEditingPortion(portion);
        setModalVisible(true);
    };

    const handleQuickToggle = (portion: DishPortion) => {
        if (portion.selected) {
            removeEating.mutate(portion);
            return;
        }
        if (portion.dish.defaultPortion) {
            addEating.mutate({ ...portion, portion: portion.dish.defaultPortion });
        } else {
            handleRowPress(portion);
        }
    };

    const handleModalSubmit = (portion: DishPortion) => {
        if (portion.selected) {
            updateEating.mutate(portion);
        } else {
            addEating.mutate(portion);
        }
    };

    const handleEndReached = () => {
        if (hasNextPage && !isFetching) {
            fetchNextPage();
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Section style={styles.headerSection}>
                <Card style={styles.headerCard}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        hitSlop={HIT_SLOP}
                        style={styles.backButton}
                    >
                        <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text.strong} />
                    </TouchableOpacity>
                    <View style={styles.titleBlock}>
                        <AppText style={styles.title}>{mealInfo.title}</AppText>
                        <AppText style={styles.subtitleDay}>{day}</AppText>
                    </View>
                    <TouchableOpacity
                        style={styles.createAction}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate("EditDish")}
                    >
                        <MaterialCommunityIcons name="plus" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                </Card>

                <Card style={styles.controlsCard}>
                    <View style={styles.searchPill}>
                        <MaterialCommunityIcons name="magnify" size={18} color={colors.text.muted} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search food"
                            placeholderTextColor={colors.text.muted}
                            style={styles.input}
                            returnKeyType="search"
                            autoCorrect={false}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery("")} hitSlop={HIT_SLOP}>
                                <MaterialCommunityIcons name="close-circle" size={18} color={colors.text.muted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.segmented}>
                        {(["all", "mine"] as const).map((s) => {
                            const active = s === scope;
                            return (
                                <Pressable
                                    key={s}
                                    onPress={() => setScope(s)}
                                    style={[styles.segment, active && styles.segmentActive]}
                                >
                                    <AppText
                                        weight="medium"
                                        style={[styles.segmentText, active && styles.segmentTextActive]}
                                    >
                                        {s === "all" ? "All" : "Mine"}
                                    </AppText>
                                </Pressable>
                            );
                        })}
                    </View>
                </Card>
            </Section>

            {isLoading ? (
                <ActivityIndicator style={styles.loader} />
            ) : (
                <FlatList
                    data={rendered}
                    keyExtractor={(item) => String(item.dish.id)}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListHeaderComponent={
                        !isSearching && rendered.length > 0 ? (
                            <AppText weight="medium" style={styles.sectionLabel}>
                                Recent
                            </AppText>
                        ) : null
                    }
                    renderItem={({ item, index }) => {
                        const weight = item.selected ? item.portion : item.dish.defaultPortion;
                        return (
                            <ListItem
                                title={item.dish.name ?? ""}
                                subtitle={`${Math.round(item.calories)} kcal${weight != null ? `, ${weight} g` : ""}`}
                                macros={{ proteins: item.proteins, fats: item.fats, carbs: item.carbs }}
                                subtitleLeading={
                                    item.dish.collectionId === userCollectionId ? (
                                        <MaterialCommunityIcons name="account" size={13} color={colors.text.muted} />
                                    ) : undefined
                                }
                                toggle={{ selected: !!item.selected, onToggle: () => handleQuickToggle(item) }}
                                onPress={() => handleRowPress(item)}
                                position={rowPosition(index, rendered.length)}
                            />
                        );
                    }}
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
                onDelete={(portion) => removeEating.mutate(portion)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.screen,
    },
    headerSection: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    headerCard: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
    titleBlock: {
        flex: 1,
        marginHorizontal: spacing.md,
    },
    createAction: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: typography.title.size,
        color: colors.text.primary,
    },
    subtitleDay: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    controlsCard: {
        gap: spacing.sm,
    },
    searchPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface.subtle,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 44,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.text.primary,
    },
    segmented: {
        flexDirection: "row",
        backgroundColor: colors.surface.subtle,
        borderRadius: radius.md,
        padding: spacing.xs,
        gap: spacing.xs,
    },
    segment: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radius.control,
        alignItems: "center",
    },
    segmentActive: {
        backgroundColor: colors.brand,
    },
    segmentText: {
        fontSize: 13,
        color: colors.text.secondary,
    },
    segmentTextActive: {
        color: colors.onBrand,
    },
    loader: {
        marginTop: spacing["3xl"],
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing["2xl"],
    },
    sectionLabel: {
        fontSize: 13,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    separator: {
        height: 2,
    },
    emptyText: {
        textAlign: "center",
        color: colors.text.muted,
        paddingVertical: spacing["3xl"],
        fontSize: 15,
    },
    footerLoader: {
        marginTop: spacing.lg,
    },
});
