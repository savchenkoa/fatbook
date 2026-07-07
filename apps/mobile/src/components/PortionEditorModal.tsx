import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import type { DishPortion } from "@fatbook/shared";
import { calculateFoodValueForPortion } from "@fatbook/shared";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { MacroRow } from "./MacroRow";
import { Sheet } from "./Sheet";

const STEP = 10;
const COMMON_PRESETS = [50, 100, 150, 200];
const MULTIPLIERS = [
    { label: "½×", factor: 0.5 },
    { label: "1×", factor: 1 },
    { label: "1½×", factor: 1.5 },
    { label: "2×", factor: 2 },
];

type Preset = { label: string; grams: number };

const round5 = (n: number) => Math.round(n / 5) * 5;

type Props = {
    visible: boolean;
    dishPortion: DishPortion | null;
    isEditing?: boolean;
    onClose: () => void;
    onSubmit: (portion: DishPortion) => void;
    onDelete?: (portion: DishPortion) => void;
};

function buildPresets(defaultPortion: number | null | undefined): Preset[] {
    // With a serving size, offer multiples of it ("two servings"); the exact
    // 1× keeps the real default. Otherwise fall back to round gram estimates.
    if (defaultPortion && defaultPortion > 0) {
        return MULTIPLIERS.map(({ label, factor }) => ({
            label,
            grams: factor === 1 ? defaultPortion : round5(defaultPortion * factor),
        }));
    }
    return COMMON_PRESETS.map((grams) => ({ label: `${grams} g`, grams }));
}

/**
 * Portion editor for the Add-eating flow. Purpose-built (not the generic
 * EditValueSheet): grams input with steppers + preset chips, and a live KBJU
 * preview that recomputes for the entered weight so the user sees what they add.
 * Grams only for MVP; portioned dishes (pcs) are a post-MVP idea.
 */
export function PortionEditorModal({
    visible,
    dishPortion,
    isEditing,
    onClose,
    onSubmit,
    onDelete,
}: Props) {
    const initial = dishPortion?.portion ?? dishPortion?.dish.defaultPortion ?? 100;
    const [draft, setDraft] = useState<number | undefined>(initial);

    useEffect(() => {
        if (visible) setDraft(initial);
        // Reset only on open; `initial` is derived from the same source.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    if (!dishPortion) {
        return null;
    }

    const { dish } = dishPortion;
    const presets = buildPresets(dish.defaultPortion);
    const preview = calculateFoodValueForPortion({ ...dishPortion, portion: draft ?? 0 });

    const stepBy = (delta: number) => setDraft((prev) => Math.max(0, (prev ?? 0) + delta));
    const canSave = draft != null && draft > 0;

    const handleSave = () => {
        if (!canSave) return;
        onSubmit({ ...dishPortion, portion: draft });
        onClose();
    };

    const handleDelete = () => {
        onDelete?.(dishPortion);
        onClose();
    };

    return (
        <Sheet visible={visible} onClose={onClose}>
            <AppText style={styles.name} numberOfLines={1}>
                {dish.name}
            </AppText>

            <View style={styles.preview}>
                <AppText style={styles.kcal}>
                    {Math.round(preview.calories)}
                    <AppText style={styles.kcalUnit}> kcal</AppText>
                </AppText>
                <MacroRow
                    proteins={preview.proteins}
                    fats={preview.fats}
                    carbs={preview.carbs}
                />
            </View>

            <View style={styles.inputRow}>
                <TouchableOpacity style={styles.stepButton} onPress={() => stepBy(-STEP)}>
                    <AppText weight="medium" style={styles.stepText}>
                        −
                    </AppText>
                </TouchableOpacity>

                <View style={styles.inputWrap}>
                    <TextInput
                        autoFocus
                        keyboardType="numeric"
                        selectTextOnFocus
                        value={draft === undefined ? "" : String(draft)}
                        onChangeText={(text) => setDraft(text ? Number(text) : undefined)}
                        style={styles.input}
                    />
                    <AppText style={styles.unit}>g</AppText>
                </View>

                <TouchableOpacity style={styles.stepButton} onPress={() => stepBy(STEP)}>
                    <AppText weight="medium" style={styles.stepText}>
                        +
                    </AppText>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presets}
                keyboardShouldPersistTaps="handled"
            >
                {presets.map((preset) => {
                    const active = draft === preset.grams;
                    return (
                        <TouchableOpacity
                            key={preset.label}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setDraft(preset.grams)}
                        >
                            <AppText
                                weight="medium"
                                style={[styles.chipText, active && styles.chipTextActive]}
                            >
                                {preset.label}
                            </AppText>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.actions}>
                {isEditing && onDelete && (
                    <Button
                        title="Delete"
                        variant="destructive"
                        size="lg"
                        style={styles.action}
                        onPress={handleDelete}
                    />
                )}
                <Button
                    title={isEditing ? "Save" : "Add"}
                    variant="primary"
                    size="lg"
                    style={styles.action}
                    disabled={!canSave}
                    onPress={handleSave}
                />
            </View>

            <TouchableOpacity onPress={onClose} style={styles.cancel}>
                <AppText style={styles.cancelText}>Cancel</AppText>
            </TouchableOpacity>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    name: {
        fontSize: 17,
        color: colors.text.primary,
        textAlign: "center",
        marginBottom: spacing.lg,
    },
    preview: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "center",
        gap: spacing.lg,
        marginBottom: spacing["2xl"],
    },
    kcal: {
        fontSize: 15,
        color: colors.text.secondary,
    },
    kcalUnit: {
        color: colors.text.muted,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    stepButton: {
        width: 48,
        height: 48,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
        alignItems: "center",
        justifyContent: "center",
    },
    stepText: {
        fontSize: 22,
        color: colors.text.strong,
    },
    inputWrap: {
        flex: 1,
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "center",
        gap: 4,
    },
    input: {
        fontSize: 32,
        color: colors.text.primary,
        textAlign: "center",
        minWidth: 72,
        paddingVertical: spacing.sm,
    },
    unit: {
        fontSize: 18,
        color: colors.text.muted,
    },
    presets: {
        flexGrow: 1,
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: spacing.xs,
        marginBottom: spacing.xl,
    },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: colors.surface.subtle,
    },
    chipActive: {
        backgroundColor: colors.brand,
    },
    chipText: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    chipTextActive: {
        color: colors.onBrand,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    action: {
        flex: 1,
    },
    cancel: {
        alignItems: "center",
        paddingVertical: spacing.sm,
    },
    cancelText: {
        fontSize: 15,
        color: colors.text.secondary,
    },
});
