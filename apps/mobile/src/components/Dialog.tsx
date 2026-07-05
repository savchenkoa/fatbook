import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme";

interface Props {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
}

/**
 * Centered modal dialog. Use for confirmations and short prompts (matches the
 * Figma center dialogs). For editing a value use `Sheet`/`EditValueSheet`
 * (bottom, thumb + keyboard); for context menus use `Dropdown`.
 */
export function Dialog({ visible, onClose, children }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                {/* Swallow taps inside the dialog so they don't dismiss it */}
                <Pressable style={styles.dialog} onPress={() => {}}>
                    {children}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    dialog: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: colors.surface.card,
        borderRadius: radius.lg,
        padding: spacing.xl,
    },
});
