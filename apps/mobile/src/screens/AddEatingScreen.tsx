import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Meals } from "@fatbook/shared";
import type { HomeStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "AddEating">;

export function AddEatingScreen({ route }: Props) {
    const { day, meal } = route.params;
    const mealInfo = Meals[meal];

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                {mealInfo.icon} {mealInfo.title} — {day}
            </Text>
            <Text style={styles.subtext}>Добавление блюда (FAT-28)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    text: {
        fontSize: 18,
        marginBottom: 8,
    },
    subtext: {
        fontSize: 14,
        color: "#aaa",
    },
});
