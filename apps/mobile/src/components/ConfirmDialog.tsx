import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface Props {
    visible: boolean;
    title: string;
    message?: string;
    confirmLabel: string;
    /** Routes the confirm button to the destructive (red) variant. */
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Centered confirmation dialog (matches Figma). For irreversible actions pass
 * `destructive` — the confirm button must never be brand-green for a Delete
 * (FAT-74 #3).
 */
export function ConfirmDialog({
    visible,
    title,
    message,
    confirmLabel,
    destructive,
    onConfirm,
    onCancel,
}: Props) {
    return (
        <Dialog visible={visible} onClose={onCancel}>
            <AppText weight="medium" style={styles.title}>
                {title}
            </AppText>
            {message ? <AppText style={styles.message}>{message}</AppText> : null}
            <View style={styles.actions}>
                <Button title="Cancel" variant="secondary" size="lg" style={styles.action} onPress={onCancel} />
                <Button
                    title={confirmLabel}
                    variant={destructive ? "destructive" : "primary"}
                    size="lg"
                    style={styles.action}
                    onPress={onConfirm}
                />
            </View>
        </Dialog>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        color: colors.text.primary,
        textAlign: "center",
    },
    message: {
        fontSize: 15,
        color: colors.text.secondary,
        textAlign: "center",
        marginTop: spacing.sm,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.xl,
    },
    action: {
        flex: 1,
    },
});
