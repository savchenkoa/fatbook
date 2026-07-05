import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Meals } from "@fatbook/shared";
import type { Dish } from "@fatbook/shared";
import { AppText } from "../components/AppText";
import { DishSearchList } from "../components/DishSearchList";
import type { HomeStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "AddEating">;

export function AddEatingScreen({ route }: Props) {
    const { day, meal } = route.params;
    const mealInfo = Meals[meal];
    const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <AppText weight="medium" style={styles.title}>
                    {mealInfo.icon} {mealInfo.title} — {day}
                </AppText>
            </View>

            {selectedDish ? (
                <View style={styles.selected}>
                    <AppText weight="medium" style={styles.selectedText}>
                        Selected: {selectedDish.name}
                    </AppText>
                    <AppText style={styles.subtext}>Порция и сохранение — FAT-28</AppText>
                </View>
            ) : (
                <DishSearchList filterEmpty onSelect={setSelectedDish} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 17,
        color: "#111827",
    },
    selected: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    selectedText: {
        fontSize: 16,
        color: "#111827",
    },
    subtext: {
        fontSize: 13,
        color: "#9CA3AF",
    },
});
