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
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Meals } from "@fatbook/shared";
import type { Dish, DishPortion } from "@fatbook/shared";
import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { MacroRow } from "../components/MacroRow";
import { PortionEditorModal } from "../components/PortionEditorModal";
import { useAuth } from "../context/auth";
import { useDailyEatings } from "../hooks/use-daily-eatings";
import { useDishesSearch } from "../hooks/use-dishes-search";
import { useEatingMutations } from "../hooks/use-eating-mutations";
import { SHARED_COLLECTION_ID } from "../constants";
import { colors, radius, spacing, typography } from "../theme";
import type { HomeStackParamList } from "../navigation/types";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Scope = "all" | "mine";

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
            <View style={styles.navRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={HIT_SLOP} style={styles.back}>
                    <Ionicons name="chevron-back" size={24} color={colors.text.strong} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.createAction}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("EditDish")}
                >
                    <Ionicons name="add" size={18} color={colors.text.secondary} />
                    <AppText weight="medium" style={styles.createActionText}>
                        New dish
                    </AppText>
                </TouchableOpacity>
            </View>

            <View style={styles.titleBlock}>
                <AppText weight="bold" style={styles.title}>
                    {mealInfo.title}
                </AppText>
                <AppText style={styles.subtitleDay}>{day}</AppText>
            </View>

            <Card style={styles.controlsCard}>
                <View style={styles.searchPill}>
                    <Ionicons name="search" size={18} color={colors.text.muted} />
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
                            <Ionicons name="close-circle" size={18} color={colors.text.muted} />
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
                    renderItem={({ item }) => (
                        <DishPickerRow
                            portion={item}
                            isCommon={item.dish.collectionId === SHARED_COLLECTION_ID}
                            onPress={() => handleRowPress(item)}
                            onQuickToggle={() => handleQuickToggle(item)}
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

interface DishPickerRowProps {
    portion: DishPortion;
    isCommon: boolean;
    onPress: () => void;
    onQuickToggle: () => void;
}

/**
 * Add-eating list row (two dense lines: name + kcal/weight with P/F/C). Two
 * independent tap targets: the row opens the portion editor, the trailing
 * button quick-adds/removes. Common (shared-pool) dishes carry a quiet globe
 * marker; the user's own dishes carry none.
 */
function DishPickerRow({ portion, isCommon, onPress, onQuickToggle }: DishPickerRowProps) {
    const selected = portion.selected;
    const weight = selected ? portion.portion : portion.dish.defaultPortion;
    return (
        <Card onPress={onPress} style={styles.row}>
            <View style={styles.rowInner}>
                <View style={styles.body}>
                    <AppText weight="medium" style={styles.name} numberOfLines={1}>
                        {portion.dish.name ?? ""}
                    </AppText>
                    <View style={styles.metaRow}>
                        <View style={styles.metaLeft}>
                            {isCommon && (
                                <Ionicons
                                    name="globe-outline"
                                    size={12}
                                    color={colors.text.muted}
                                />
                            )}
                            <AppText style={styles.subtitle}>
                                {Math.round(portion.calories)} kcal
                                {weight != null ? `, ${weight} g` : ""}
                            </AppText>
                        </View>
                        <MacroRow
                            proteins={portion.proteins}
                            fats={portion.fats}
                            carbs={portion.carbs}
                        />
                    </View>
                </View>
                <Pressable onPress={onQuickToggle} hitSlop={HIT_SLOP} style={styles.quickButton}>
                    <Ionicons
                        name={selected ? "checkmark-circle" : "add-circle-outline"}
                        size={28}
                        color={selected ? colors.brand : colors.text.muted}
                    />
                </Pressable>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.screen,
    },
    navRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        height: 44,
    },
    back: {
        marginLeft: -spacing.xs,
    },
    createAction: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
    },
    createActionText: {
        fontSize: 14,
        color: colors.text.primary,
    },
    titleBlock: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.title.size,
        color: colors.text.primary,
    },
    subtitleDay: {
        fontSize: 13,
        color: colors.text.secondary,
        marginTop: 2,
    },
    controlsCard: {
        marginHorizontal: spacing.lg,
        padding: spacing.sm,
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
        height: spacing.sm,
    },
    row: {
        paddingVertical: spacing.xl,
        borderRadius: radius.lg,
    },
    rowInner: {
        flexDirection: "row",
        alignItems: "center",
    },
    body: {
        flex: 1,
        gap: spacing.xs,
    },
    name: {
        fontSize: 16,
        color: colors.text.primary,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    metaLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    subtitle: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    quickButton: {
        marginLeft: spacing.sm,
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
