import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { formatDate, now } from "@fatbook/shared";
import type { MealType } from "@fatbook/shared";
import { useDailyEatings } from "../hooks/use-daily-eatings";
import { useSettings } from "../hooks/use-settings";
import { NutritionSummary } from "../components/NutritionSummary";
import { MealCard } from "../components/MealCard";
import { AppText } from "../components/AppText";
import type { HomeStackParamList } from "../navigation/types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

type DiaryNavProp = NativeStackNavigationProp<HomeStackParamList, "Diary">;

export function DiaryScreen() {
    const navigation = useNavigation<DiaryNavProp>();
    const today = formatDate(now());
    const { data: dailyEatings, isLoading } = useDailyEatings(today);
    const { data: settings } = useSettings();
    const dailyCalorieGoal = settings?.calories ?? 0;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Дата — навигация добавится в FAT-27 */}
            <View style={styles.dateHeader}>
                <AppText weight="medium" style={styles.dateText}>{today}</AppText>
            </View>

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
                                    navigation.navigate("MealDetail", { day: today, meal })
                                }
                                onAdd={() =>
                                    navigation.navigate("AddEating", { day: today, meal })
                                }
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    dateHeader: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: "center",
    },
    dateText: {
        fontSize: 15,
        color: "#374151",
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
});
