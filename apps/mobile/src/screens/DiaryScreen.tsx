import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
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
import { AppText } from "../components/AppText";
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

    const { data: dailyEatings, isLoading } = useDailyEatings(day);
    const { data: settings } = useSettings();
    const dailyCalorieGoal = settings?.calories ?? 0;
    const [pickerVisible, setPickerVisible] = useState(false);

    const goToDate = (date: Date | number) => {
        navigation.setParams({ day: formatDate(date) });
    };

    const handleBack = () => goToDate(getPrevDay(parsedDay));
    const handleForward = () => goToDate(getNextDay(parsedDay));
    const handleToday = () => goToDate(now());

    const handleAndroidValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
        setPickerVisible(false);
        goToDate(selectedDate);
    };

    const handleIosValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
        goToDate(selectedDate);
    };

    const handlePickerDismiss = () => setPickerVisible(false);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2,
            onPanResponderRelease: (_, gestureState) => {
                const currentDay = parse(dayRef.current);
                if (gestureState.dx <= -SWIPE_DISTANCE_THRESHOLD) {
                    navigation.setParams({ day: formatDate(getNextDay(currentDay)) });
                } else if (gestureState.dx >= SWIPE_DISTANCE_THRESHOLD) {
                    navigation.setParams({ day: formatDate(getPrevDay(currentDay)) });
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
                        <Ionicons name="chevron-back" size={22} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.dateButton}>
                        <AppText weight="medium" style={styles.dateText}>{formatDate(parsedDay)}</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleForward}
                        style={styles.navButton}
                        hitSlop={HIT_SLOP}
                        accessibilityLabel="go to one day forward"
                    >
                        <Ionicons name="chevron-forward" size={22} color="#374151" />
                    </TouchableOpacity>
                </View>
                {!isToday && (
                    <TouchableOpacity onPress={handleToday} style={styles.todayButton} hitSlop={HIT_SLOP}>
                        <Ionicons name="refresh" size={14} color="#4ADE80" />
                        <AppText weight="medium" style={styles.todayText}>Today</AppText>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.swipeArea} {...panResponder.panHandlers}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <NutritionSummary
                        current={dailyEatings}
                        goals={settings}
                        isLoading={isLoading}
                    />

                    <View style={styles.meals}>
                        {isLoading ? (
                            <ActivityIndicator style={styles.loader} />
                        ) : (
                            MEAL_ORDER.map((meal, index) => (
                                <MealCard
                                    key={meal}
                                    meal={meal}
                                    data={dailyEatings?.meals[meal]}
                                    dailyCalorieGoal={dailyCalorieGoal}
                                    isFirst={index === 0}
                                    isLast={index === MEAL_ORDER.length - 1}
                                    onPress={() =>
                                        navigation.navigate("MealDetail", { day, meal })
                                    }
                                    onAdd={() =>
                                        navigation.navigate("AddEating", { day, meal })
                                    }
                                />
                            ))
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
                <Modal
                    visible={pickerVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setPickerVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalSheet}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                    <AppText weight="medium" style={styles.modalDone}>Done</AppText>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={parsedDay}
                                mode="date"
                                display="inline"
                                onValueChange={handleIosValueChange}
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    navButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    dateButton: {
        minWidth: 120,
        alignItems: "center",
    },
    dateText: {
        fontSize: 15,
        color: "#374151",
    },
    todayButton: {
        position: "absolute",
        top: 10,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    todayText: {
        fontSize: 13,
        color: "#4ADE80",
    },
    swipeArea: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingBottom: 24,
    },
    meals: {
        paddingTop: 8,
        gap: 2,
    },
    loader: {
        marginTop: 32,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    modalSheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 16,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    modalDone: {
        fontSize: 16,
        color: "#4ADE80",
    },
});
