import { useEffect, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

interface SecondaryAction {
    label: string;
    destructive?: boolean;
    onPress: () => void;
}

interface Props {
    visible: boolean;
    title: string;
    value: number | undefined;
    unit?: string;
    /** Show −/+ steppers with this increment. Omit for a plain field. */
    step?: number;
    saveLabel?: string;
    onSave: (value: number) => void;
    onCancel: () => void;
    /** Optional extra action, e.g. Delete when editing an existing item. */
    secondaryAction?: SecondaryAction;
}

/**
 * The single sheet for editing one number — Serving size, Calories, Cooked
 * weight, portion grams. Replaces the ad-hoc center dialogs (FAT-74 #2).
 */
export function EditValueSheet({
    visible,
    title,
    value,
    unit = "g",
    step,
    saveLabel = "Save",
    onSave,
    onCancel,
    secondaryAction,
}: Props) {
    const [draft, setDraft] = useState<number | undefined>(value);

    useEffect(() => {
        if (visible) setDraft(value);
    }, [visible, value]);

    const stepBy = (delta: number) => setDraft((prev) => Math.max(0, (prev ?? 0) + delta));

    const canSave = draft != null && draft > 0;
    const handleSave = () => {
        if (canSave) onSave(draft);
    };

    return (
        <Sheet visible={visible} onClose={onCancel}>
            <AppText weight="medium" style={styles.title}>
                {title}
            </AppText>

            <View style={styles.inputRow}>
                {step != null && (
                    <TouchableOpacity style={styles.stepButton} onPress={() => stepBy(-step)}>
                        <AppText weight="medium" style={styles.stepText}>−</AppText>
                    </TouchableOpacity>
                )}

                <View style={styles.inputWrap}>
                    <TextInput
                        autoFocus
                        keyboardType="numeric"
                        selectTextOnFocus
                        value={draft === undefined ? "" : String(draft)}
                        onChangeText={(text) => setDraft(text ? Number(text) : undefined)}
                        style={styles.input}
                    />
                    {unit ? <AppText style={styles.unit}>{unit}</AppText> : null}
                </View>

                {step != null && (
                    <TouchableOpacity style={styles.stepButton} onPress={() => stepBy(step)}>
                        <AppText weight="medium" style={styles.stepText}>+</AppText>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.actions}>
                {secondaryAction && (
                    <Button
                        title={secondaryAction.label}
                        variant={secondaryAction.destructive ? "destructive" : "secondary"}
                        size="lg"
                        style={styles.action}
                        onPress={secondaryAction.onPress}
                    />
                )}
                <Button
                    title={saveLabel}
                    variant="primary"
                    size="lg"
                    style={styles.action}
                    disabled={!canSave}
                    onPress={handleSave}
                />
            </View>

            <TouchableOpacity onPress={onCancel} style={styles.cancel}>
                <AppText style={styles.cancelText}>Cancel</AppText>
            </TouchableOpacity>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        color: colors.text.primary,
        textAlign: "center",
        marginBottom: spacing.xl,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing["2xl"],
    },
    stepButton: {
        width: 48,
        height: 48,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    stepText: {
        fontSize: 20,
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
        fontSize: 36,
        color: colors.text.primary,
        textAlign: "center",
        minWidth: 80,
        paddingVertical: spacing.sm,
    },
    unit: {
        fontSize: 18,
        color: colors.text.muted,
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
