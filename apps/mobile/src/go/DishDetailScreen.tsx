import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/auth-context";
import { useGoApi } from "../context/go-api";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ListItem } from "../components/ListItem";
import { MacroRow } from "../components/MacroRow";
import { Section } from "../components/Section";
import { colors, spacing, typography } from "../theme";
import type { GoDishesStackParamList } from "./navigation";

export function GoDishDetailScreen({
    route,
}: NativeStackScreenProps<GoDishesStackParamList, "DishDetail">) {
    const api = useGoApi();
    const { userId } = useAuth();
    const {
        data: dish,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["go", userId, "dish", route.params.dishId],
        queryFn: () => api.dish(route.params.dishId),
        retry: false,
    });
    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
        >
            {isLoading && <ActivityIndicator color={colors.brand} />}
            {isError && (
                <Card>
                    <AppText>Не удалось загрузить рецепт.</AppText>
                    <Button
                        title="Повторить"
                        variant="secondary"
                        onPress={() => void refetch()}
                    />
                </Card>
            )}
            {dish && (
                <>
                    <Card>
                        <AppText weight="bold" style={styles.title}>
                            {dish.icon ?? "🥘"} {dish.name}
                        </AppText>
                        <AppText>
                            На 100 г: {dish.calories.toFixed(2)} ккал
                        </AppText>
                        <MacroRow
                            proteins={dish.proteins}
                            fats={dish.fats}
                            carbs={dish.carbs}
                        />
                        {dish.cookedWeight !== null && (
                            <AppText>
                                Готовый вес: {dish.cookedWeight} г
                            </AppText>
                        )}
                        {dish.defaultPortion !== null && (
                            <AppText>
                                Обычная порция: {dish.defaultPortion} г
                            </AppText>
                        )}
                    </Card>
                    <Section>
                        {dish.ingredients.map((item) => (
                            <ListItem
                                key={item.id}
                                title={item.sourceSnapshot.name}
                                leading={item.sourceSnapshot.icon ?? "🥫"}
                                subtitle={`${item.portion} г, ${item.calories.toFixed(2)} ккал`}
                                macros={item}
                                trailing="none"
                            />
                        ))}
                    </Section>
                </>
            )}
        </ScrollView>
    );
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surface.screen },
    title: {
        fontSize: typography.title.size,
        lineHeight: typography.title.lineHeight,
    },
    content: { padding: spacing.lg, gap: spacing.lg },
});
