import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { DishSummary } from "@fatbook/api-client/go";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EditValueSheet } from "../components/EditValueSheet";
import { GoDishSearchList } from "./DishSearchList";
import { useRecipeDraft } from "./recipe-context";
import type { GoDishesStackParamList } from "./navigation";
import { colors } from "../theme";

export function GoAddIngredientsScreen({
    navigation,
}: NativeStackScreenProps<GoDishesStackParamList, "AddIngredients">) {
    const { draft, setDraft } = useRecipeDraft();
    const [source, setSource] = useState<DishSummary | null>(null);
    return (
        <View style={styles.screen}>
            <GoDishSearchList
                scope="ingredients"
                excludedIds={draft.ingredients.map((item) => item.source.id)}
                onSelect={setSource}
            />
            <EditValueSheet
                visible={source !== null}
                title={source?.name ?? "Вес ингредиента"}
                value={source?.defaultPortion ?? 100}
                unit="г"
                saveLabel="Добавить"
                onCancel={() => setSource(null)}
                onSave={(portion) => {
                    if (!source || !Number.isFinite(portion) || portion <= 0)
                        return;
                    setDraft((current) => ({
                        ...current,
                        ingredients: [
                            ...current.ingredients,
                            { source, portion },
                        ],
                    }));
                    setSource(null);
                    navigation.goBack();
                }}
            />
        </View>
    );
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surface.screen },
});
