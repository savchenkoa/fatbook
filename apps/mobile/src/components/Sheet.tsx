import type { ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { colors, radius, spacing } from "../theme";

interface Props {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
}

/**
 * Base bottom sheet — the single container for all inline edits, menus, and
 * confirms. Fixes the "three different modals" finding (FAT-74 #2): no more
 * center dialogs of random size. Build `EditValueSheet` / `ConfirmSheet` /
 * menus on top of this, never a bespoke `Modal`.
 */
export function Sheet({ visible, onClose, children }: Props) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* Tap outside to dismiss */}
                <Pressable style={styles.overlay} onPress={onClose}>
                    {/* Swallow taps inside the sheet so they don't dismiss */}
                    <Pressable style={styles.sheet} onPress={() => {}}>
                        <View style={styles.handle} />
                        {children}
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    sheet: {
        backgroundColor: colors.surface.card,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing["3xl"],
    },
    handle: {
        alignSelf: "center",
        width: 40,
        height: 4,
        borderRadius: radius.full,
        backgroundColor: colors.surface.track,
        marginBottom: spacing.lg,
    },
});
