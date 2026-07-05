import { useEffect, useState } from "react";
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import type { DishPortion } from "@fatbook/shared";
import { AppText } from "./AppText";

const STEP = 10;

function getDishIcon(dish: DishPortion["dish"]) {
    if (dish.icon) {
        return dish.icon;
    }
    return dish.hasIngredients ? "🥘" : "🥫";
}

type Props = {
    visible: boolean;
    dishPortion: DishPortion | null;
    isEditing?: boolean;
    onClose: () => void;
    onSubmit: (portion: DishPortion) => void;
    onDelete?: (portion: DishPortion) => void;
};

export function PortionEditorModal({ visible, dishPortion, isEditing, onClose, onSubmit, onDelete }: Props) {
    const [portionSize, setPortionSize] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (dishPortion) {
            setPortionSize(dishPortion.portion ?? dishPortion.dish.defaultPortion ?? 100);
        }
    }, [dishPortion]);

    if (!dishPortion) {
        return null;
    }

    const handleStep = (delta: number) => {
        setPortionSize((prev) => Math.max(0, (prev ?? 0) + delta));
    };

    const handleSubmit = () => {
        if (!portionSize) {
            return;
        }
        onSubmit({ ...dishPortion, portion: portionSize });
        onClose();
    };

    const handleDelete = () => {
        onDelete?.(dishPortion);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <AppText weight="medium" style={styles.title}>
                        {getDishIcon(dishPortion.dish)} {dishPortion.dish.name}
                    </AppText>

                    <View style={styles.row}>
                        <TouchableOpacity style={styles.stepButton} onPress={() => handleStep(-STEP)}>
                            <AppText weight="medium" style={styles.stepText}>−</AppText>
                        </TouchableOpacity>

                        <View style={styles.inputWrap}>
                            <TextInput
                                autoFocus
                                keyboardType="numeric"
                                selectTextOnFocus
                                value={portionSize === undefined ? "" : String(portionSize)}
                                onChangeText={(text) => setPortionSize(text ? Number(text) : undefined)}
                                style={styles.input}
                            />
                            <AppText style={styles.unit}>g</AppText>
                        </View>

                        <TouchableOpacity style={styles.stepButton} onPress={() => handleStep(STEP)}>
                            <AppText weight="medium" style={styles.stepText}>+</AppText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actions}>
                        {isEditing && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                <AppText weight="medium" style={styles.deleteText}>Delete</AppText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.submitButton, !portionSize && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={!portionSize}
                        >
                            <AppText weight="medium" style={styles.submitText}>
                                {isEditing ? "Save" : "Add"}
                            </AppText>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                        <AppText style={styles.cancelText}>Cancel</AppText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    sheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
    },
    title: {
        fontSize: 18,
        color: "#111827",
        textAlign: "center",
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
    },
    stepButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
    },
    stepText: {
        fontSize: 20,
        color: "#374151",
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
        color: "#111827",
        textAlign: "center",
        minWidth: 80,
        paddingVertical: 8,
    },
    unit: {
        fontSize: 18,
        color: "#9CA3AF",
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    deleteButton: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EF4444",
        alignItems: "center",
        justifyContent: "center",
    },
    deleteText: {
        fontSize: 15,
        color: "#EF4444",
    },
    submitButton: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#4ADE80",
        alignItems: "center",
        justifyContent: "center",
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontSize: 15,
        color: "#fff",
    },
    cancelButton: {
        alignItems: "center",
        paddingVertical: 8,
    },
    cancelText: {
        fontSize: 15,
        color: "#6B7280",
    },
});
