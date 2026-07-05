import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme";

/** Screen coordinates the menu is anchored to (top edge + distance from right). */
export interface DropdownAnchor {
    top: number;
    right: number;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    anchor: DropdownAnchor;
    children: ReactNode;
}

/**
 * Anchored popover menu for item-level context actions (the ⋮ button). Grows
 * from its trigger — use this for context menus, not `Sheet`. `Sheet` is for
 * editing/input; a bottom sheet for a 2–4 item menu is too heavy and loses the
 * spatial link to the trigger.
 */
export function Dropdown({ visible, onClose, anchor, children }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                {/* Swallow taps inside the menu so they don't dismiss it */}
                <Pressable
                    style={[styles.menu, { top: anchor.top, right: anchor.right }]}
                    onPress={() => {}}
                >
                    {children}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    menu: {
        position: "absolute",
        minWidth: 200,
        backgroundColor: colors.surface.card,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
});
