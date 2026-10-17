import { View, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import { GoDishSearchList } from "./DishSearchList";
import type { GoDishesStackParamList } from "./navigation";
import { colors, spacing } from "../theme";

export function GoDishesListScreen({
    navigation,
}: NativeStackScreenProps<GoDishesStackParamList, "DishesList">) {
    return (
        <View style={styles.screen}>
            <GoDishSearchList
                scope="mine"
                onSelect={(dish) =>
                    navigation.navigate("DishDetail", { dishId: dish.id })
                }
            />
            <View style={styles.action}>
                <Button
                    title="Создать рецепт"
                    variant="primary"
                    size="lg"
                    onPress={() => navigation.navigate("EditDish")}
                />
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surface.screen },
    action: { padding: spacing.lg },
});
