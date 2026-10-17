import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { usePreventRemove } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ApiError } from "@fatbook/api-client/go";
import { calculateDishValuePer100g, calculateFoodValue } from "@fatbook/shared";
import { useAuth } from "../context/auth-context";
import { useGoApi } from "../context/go-api";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EditValueSheet } from "../components/EditValueSheet";
import { ListItem } from "../components/ListItem";
import { MacroRow } from "../components/MacroRow";
import { Section } from "../components/Section";
import { colors, radius, spacing, typography, fontFamily } from "../theme";
import { useRecipeDraft } from "./recipe-context";
import type { GoDishesStackParamList } from "./navigation";

type Editor = "cookedWeight" | "defaultPortion" | number;

export function GoEditDishScreen({
    navigation,
}: NativeStackScreenProps<GoDishesStackParamList, "EditDish">) {
    const { draft, setDraft, submission, reset } = useRecipeDraft();
    const api = useGoApi();
    const { userId } = useAuth();
    const queryClient = useQueryClient();
    const [editor, setEditor] = useState<Editor | null>(null);
    const [saving, setSaving] = useState(false);
    const busy = useRef(false);
    const [savedDishId, setSavedDishId] = useState<number | null>(null);
    usePreventRemove(saving && savedDishId === null, () => {});
    useEffect(() => {
        if (savedDishId !== null)
            navigation.replace("DishDetail", { dishId: savedDishId });
    }, [navigation, savedDishId]);
    const [error, setError] = useState<string | null>(null);
    const ingredients = draft.ingredients.map(({ source, portion }) => {
        const dish = { ...source, collectionId: source.spaceId };
        return {
            dish,
            portion,
            ...calculateFoodValue({ ...source, dish, portion }),
        };
    });
    const preview =
        draft.cookedWeight && ingredients.length
            ? calculateDishValuePer100g(ingredients, draft.cookedWeight)
            : null;
    const canSave =
        draft.name.trim().length > 0 &&
        Array.from(draft.name.trim()).length <= 100 &&
        draft.cookedWeight !== null &&
        Number.isFinite(draft.cookedWeight) &&
        draft.cookedWeight > 0 &&
        draft.ingredients.length > 0 &&
        draft.ingredients.length <= 100;
    const selectedIngredient =
        typeof editor === "number" ? draft.ingredients[editor] : undefined;

    const save = async () => {
        if (busy.current || !canSave || draft.cookedWeight === null) return;
        busy.current = true;
        setSaving(true);
        setError(null);
        const isCurrentSession = api.captureSession();
        try {
            const dish = await submission.save(api, {
                name: draft.name,
                icon: draft.icon || null,
                defaultPortion: draft.defaultPortion,
                cookedWeight: draft.cookedWeight,
                ingredients: draft.ingredients.map(({ source, portion }) => ({
                    dishId: source.id,
                    portion,
                })),
            });
            if (!isCurrentSession()) return;
            queryClient.setQueryData(["go", userId, "dish", dish.id], dish);
            void queryClient.invalidateQueries({
                queryKey: ["go", userId, "dishes", "mine"],
            });
            setSaving(false);
            reset();
            setSavedDishId(dish.id);
        } catch (error) {
            setError(
                error instanceof ApiError && error.status === 404
                    ? "Один из ингредиентов больше недоступен. Замените его и повторите сохранение."
                    : error instanceof ApiError && error.status === 422
                      ? "Проверьте название, состав и вес блюда."
                      : "Не удалось сохранить рецепт. Черновик сохранён; повторите попытку.",
            );
        } finally {
            busy.current = false;
            setSaving(false);
        }
    };
    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Card>
                    <AppText>Название рецепта</AppText>
                    <TextInput
                        accessibilityLabel="Название рецепта"
                        value={draft.name}
                        editable={!saving}
                        style={styles.input}
                        onChangeText={(name) =>
                            setDraft((current) => ({ ...current, name }))
                        }
                    />
                    <AppText>Иконка</AppText>
                    <TextInput
                        accessibilityLabel="Иконка"
                        value={draft.icon}
                        editable={!saving}
                        style={styles.input}
                        onChangeText={(icon) =>
                            setDraft((current) => ({ ...current, icon }))
                        }
                    />
                </Card>
                <Section>
                    <ListItem
                        title="Готовый вес (обязательно)"
                        subtitle={
                            draft.cookedWeight === null
                                ? "Укажите вес готового блюда"
                                : `${draft.cookedWeight} г`
                        }
                        onPress={() => !saving && setEditor("cookedWeight")}
                    />
                    <ListItem
                        title="Обычная порция"
                        subtitle={
                            draft.defaultPortion === null
                                ? "Не задана"
                                : `${draft.defaultPortion} г`
                        }
                        onPress={() => !saving && setEditor("defaultPortion")}
                    />
                </Section>
                <AppText weight="medium" style={styles.sectionTitle}>
                    Ингредиенты
                </AppText>
                <Section>
                    {draft.ingredients.map(({ source, portion }, index) => (
                        <ListItem
                            key={source.id}
                            title={source.name}
                            leading={source.icon ?? "🥫"}
                            subtitle={`${portion} г`}
                            macros={ingredients[index]}
                            onPress={() => !saving && setEditor(index)}
                        />
                    ))}
                </Section>
                <Button
                    title="Добавить ингредиент"
                    variant="secondary"
                    disabled={saving || draft.ingredients.length >= 100}
                    onPress={() => navigation.navigate("AddIngredients")}
                />
                {preview && (
                    <Card>
                        <AppText weight="medium">
                            Предварительно на 100 г
                        </AppText>
                        <AppText>{preview.calories.toFixed(2)} ккал</AppText>
                        <MacroRow
                            proteins={preview.proteins}
                            fats={preview.fats}
                            carbs={preview.carbs}
                        />
                    </Card>
                )}
                {error && (
                    <AppText accessibilityRole="alert" style={styles.error}>
                        {error}
                    </AppText>
                )}
            </ScrollView>
            <View style={styles.action}>
                <Button
                    title="Сохранить рецепт"
                    variant="primary"
                    size="lg"
                    loading={saving}
                    disabled={!canSave}
                    onPress={() => void save()}
                />
            </View>
            <EditValueSheet
                visible={editor !== null}
                title={
                    typeof editor === "number"
                        ? (selectedIngredient?.source.name ?? "Вес ингредиента")
                        : editor === "cookedWeight"
                          ? "Вес готового блюда"
                          : "Обычная порция"
                }
                value={
                    typeof editor === "number"
                        ? selectedIngredient?.portion
                        : editor
                          ? (draft[editor] ?? undefined)
                          : undefined
                }
                unit="г"
                saveLabel="Сохранить"
                onCancel={() => setEditor(null)}
                onSave={(value) => {
                    if (!Number.isFinite(value) || value <= 0) return;
                    setDraft((current) =>
                        typeof editor === "number"
                            ? {
                                  ...current,
                                  ingredients: current.ingredients.map(
                                      (item, index) =>
                                          index === editor
                                              ? { ...item, portion: value }
                                              : item,
                                  ),
                              }
                            : editor
                              ? { ...current, [editor]: value }
                              : current,
                    );
                    setEditor(null);
                }}
                secondaryAction={
                    typeof editor === "number"
                        ? {
                              label: "Удалить ингредиент",
                              destructive: true,
                              onPress: () => {
                                  setDraft((current) => ({
                                      ...current,
                                      ingredients: current.ingredients.filter(
                                          (_, index) => index !== editor,
                                      ),
                                  }));
                                  setEditor(null);
                              },
                          }
                        : editor === "defaultPortion"
                          ? {
                                label: "Убрать порцию",
                                onPress: () => {
                                    setDraft((current) => ({
                                        ...current,
                                        defaultPortion: null,
                                    }));
                                    setEditor(null);
                                },
                            }
                          : undefined
                }
            />
        </View>
    );
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surface.screen },
    content: { padding: spacing.lg, gap: spacing.lg },
    input: {
        fontSize: typography.body.size,
        lineHeight: typography.body.lineHeight,
        fontFamily: fontFamily.regular,
        color: colors.text.primary,
        backgroundColor: colors.surface.subtle,
        borderRadius: radius.control,
        padding: spacing.md,
        marginVertical: spacing.sm,
    },
    action: { padding: spacing.lg },
    sectionTitle: {
        fontSize: typography.subtitle.size,
        lineHeight: typography.subtitle.lineHeight,
    },
    error: { color: colors.destructive },
});
