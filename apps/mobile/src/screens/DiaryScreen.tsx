import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { formatDate, now } from "@fatbook/shared";
import type { MealType } from "@fatbook/shared";
import { useDailyEatings } from "../hooks/use-daily-eatings";
import { useSettings } from "../hooks/use-settings";
import { NutritionSummary } from "../components/NutritionSummary";
import { MealSection } from "../components/MealSection";
import type { RootStackParamList } from "../navigation/types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

type DiaryNavProp = NativeStackNavigationProp<RootStackParamList, "Diary">;

export function DiaryScreen() {
    const navigation = useNavigation<DiaryNavProp>();
    const today = formatDate(now());
    const { data: dailyEatings, isLoading } = useDailyEatings(today);
    const { data: settings } = useSettings();
    const [expandedMeal, setExpandedMeal] = useState<MealType | null>("breakfast");

    function toggleMeal(meal: MealType) {
        setExpandedMeal((prev) => (prev === meal ? null : meal));
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <NutritionSummary
                current={dailyEatings}
                goals={settings}
                isLoading={isLoading}
            />

            {isLoading ? (
                <View style={styles.loadingMeals}>
                    <ActivityIndicator />
                </View>
            ) : (
                MEAL_ORDER.map((meal) => (
                    <MealSection
                        key={meal}
                        meal={meal}
                        data={dailyEatings?.meals[meal]}
                        isExpanded={expandedMeal === meal}
                        onToggle={() => toggleMeal(meal)}
                        onAdd={() => navigation.navigate("AddEating", { day: today, meal })}
                    />
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    content: {
        paddingBottom: 24,
    },
    loadingMeals: {
        marginTop: 32,
        alignItems: "center",
    },
});
