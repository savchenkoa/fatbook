import { useRef, useState } from "react";
import {
    ActivityIndicator,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
    formatDate,
    getNextDay,
    getPrevDay,
    isToday as checkIsToday,
    now,
    parse,
} from "@fatbook/shared";
import type { MealType } from "@fatbook/shared";
import { useDailyEatings } from "../hooks/use-daily-eatings";
import { useSettings } from "../hooks/use-settings";
import { NutritionSummary } from "../components/NutritionSummary";
import { MealCard } from "../components/MealCard";
import { Sheet } from "../components/Sheet";
import { Button } from "../components/Button";
import { AppText } from "../components/AppText";
import { colors, spacing, typography, sizes } from "../theme";
import type { HomeStackParamList } from "../navigation/types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const SWIPE_DISTANCE_THRESHOLD = 50;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = NativeStackScreenProps<HomeStackParamList, "Diary">;

export function DiaryScreen({ route, navigation }: Props) {
    const day = route.params?.day ?? formatDate(now());
    const parsedDay = parse(day);
    const isToday = checkIsToday(day);
    const dayRef = useRef(day);
    dayRef.current = day;

    const {
        data: dailyEatings,
        isLoading,
        isError,
        refetch,
    } = useDailyEatings(day);
    const { data: settings } = useSettings();
    const dailyCalorieGoal = settings?.calories ?? 0;
    const [pickerVisible, setPickerVisible] = useState(false);

    const goToDate = (date: Date | number) => {
        navigation.setParams({ day: formatDate(date) });
    };

    const handleBack = () => goToDate(getPrevDay(parsedDay));
    const handleForward = () => goToDate(getNextDay(parsedDay));
    const handleToday = () => goToDate(now());

    const handleAndroidValueChange = (
        _event: DateTimePickerChangeEvent,
        selectedDate: Date,
    ) => {
        setPickerVisible(false);
        goToDate(selectedDate);
    };

    const handleIosValueChange = (
        _event: DateTimePickerChangeEvent,
        selectedDate: Date,
    ) => {
        goToDate(selectedDate);
    };

    const handlePickerDismiss = () => setPickerVisible(false);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dx) > 20 &&
                Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2,
            onPanResponderRelease: (_, gestureState) => {
                const currentDay = parse(dayRef.current);
                if (gestureState.dx <= -SWIPE_DISTANCE_THRESHOLD) {
                    navigation.setParams({
                        day: formatDate(getNextDay(currentDay)),
                    });
                } else if (gestureState.dx >= SWIPE_DISTANCE_THRESHOLD) {
                    navigation.setParams({
                        day: formatDate(getPrevDay(currentDay)),
                    });
                }
            },
        }),
    ).current;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <View style={styles.dateRow}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.navButton}
                        hitSlop={HIT_SLOP}
                        accessibilityLabel="go to one day back"
                    >
                        <Ionicons
                            name="chevron-back"
                            size={22}
                            color={colors.text.strong}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setPickerVisible(true)}
                        style={styles.dateButton}
                    >
                        <AppText weight="medium" style={styles.dateText}>
                            {formatDate(parsedDay)}
                        </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleForward}
                        style={styles.navButton}
                        hitSlop={HIT_SLOP}
                        accessibilityLabel="go to one day forward"
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={22}
                            color={colors.text.strong}
                        />
                    </TouchableOpacity>
                </View>
                {!isToday && (
                    <TouchableOpacity
                        onPress={handleToday}
                        style={styles.todayButton}
                        hitSlop={HIT_SLOP}
                    >
                        <Ionicons
                            name="refresh"
                            size={14}
                            color={colors.brand}
                        />
                        <AppText weight="medium" style={styles.todayText}>
                            Today
                        </AppText>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.swipeArea} {...panResponder.panHandlers}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {isError && (
                        <Button
                            title="Не удалось загрузить дневник. Повторить"
                            variant="secondary"
                            onPress={() => void refetch()}
                        />
                    )}
                    {(dailyEatings || isLoading) && (
                        <NutritionSummary
                            current={dailyEatings}
                            goals={settings}
                            isLoading={isLoading}
                        />
                    )}

                    <View style={styles.meals}>
                        {isLoading ? (
                            <ActivityIndicator style={styles.loader} />
                        ) : dailyEatings ? (
                            MEAL_ORDER.map((meal, index) => (
                                <MealCard
                                    key={meal}
                                    meal={meal}
                                    data={dailyEatings?.meals[meal]}
                                    dailyCalorieGoal={dailyCalorieGoal}
                                    isFirst={index === 0}
                                    isLast={index === MEAL_ORDER.length - 1}
                                    onPress={() =>
                                        navigation.navigate("MealDetail", {
                                            day,
                                            meal,
                                        })
                                    }
                                    onAdd={() =>
                                        navigation.navigate("AddEating", {
                                            day,
                                            meal,
                                        })
                                    }
                                />
                            ))
                        ) : (
                            <AppText>Дневник недоступен</AppText>
                        )}
                    </View>
                </ScrollView>
            </View>

            {Platform.OS === "android" && pickerVisible && (
                <DateTimePicker
                    value={parsedDay}
                    mode="date"
                    display="default"
                    onValueChange={handleAndroidValueChange}
                    onDismiss={handlePickerDismiss}
                />
            )}

            {Platform.OS === "ios" && (
                <Sheet
                    visible={pickerVisible}
                    onClose={() => setPickerVisible(false)}
                >
                    <View style={styles.modalHeader}>
                        <Button
                            title="Done"
                            variant="ghost"
                            size="sm"
                            onPress={() => setPickerVisible(false)}
                        />
                    </View>
                    <DateTimePicker
                        value={parsedDay}
                        mode="date"
                        display="inline"
                        onValueChange={handleIosValueChange}
                    />
                </Sheet>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.screen,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
    },
    navButton: {
        width: spacing["3xl"],
        height: spacing["3xl"],
        alignItems: "center",
        justifyContent: "center",
    },
    dateButton: {
        minWidth: sizes.dateButton,
        alignItems: "center",
    },
    dateText: {
        fontSize: typography.body.size,
        color: colors.text.strong,
    },
    todayButton: {
        position: "absolute",
        top: spacing.sm,
        right: spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    todayText: {
        fontSize: typography.label.size,
        color: colors.brand,
    },
    swipeArea: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingBottom: spacing["2xl"],
    },
    meals: {
        paddingTop: spacing.sm,
        gap: sizes.separator,
    },
    loader: {
        marginTop: spacing["3xl"],
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: sizes.hairline,
        borderBottomColor: colors.border,
    },
});
