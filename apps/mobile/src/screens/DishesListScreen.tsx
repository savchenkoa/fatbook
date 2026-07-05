import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { DishSearchList } from "../components/DishSearchList";
import { colors, radius, spacing } from "../theme";
import type { DishesStackParamList } from "../navigation/types";

type NavProp = NativeStackNavigationProp<DishesStackParamList, "DishesList">;

export function DishesListScreen() {
    const navigation = useNavigation<NavProp>();

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <DishSearchList onSelect={(dish) => navigation.navigate("DishDetail", { dishId: dish.id })} />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("EditDish")}
                activeOpacity={0.85}
            >
                <Ionicons name="add" size={28} color={colors.onBrand} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface.screen,
    },
    fab: {
        position: "absolute",
        right: spacing.xl,
        bottom: spacing["2xl"],
        width: 56,
        height: 56,
        borderRadius: radius.full,
        backgroundColor: colors.brand,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
});
