import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
    Animated,
    Easing,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
} from "react-native";
import { colors, radius, spacing } from "../theme";

interface Props {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
}

const OPEN_DURATION = 240;
const CLOSE_DURATION = 180;
/** Fallback slide distance until the sheet's real height is measured. */
const FALLBACK_OFFSET = 800;

/**
 * Base bottom sheet for editing/input flows (thumb + keyboard). The backdrop
 * fades while the panel slides independently — driven by one Animated value, not
 * RN's `animationType="slide"` (which slides the backdrop with the panel).
 * For context menus use `Dropdown`; for confirmations use `Dialog`/`ConfirmDialog`.
 */
export function Sheet({ visible, onClose, children }: Props) {
    // Stay mounted through the close animation, then unmount.
    const [mounted, setMounted] = useState(visible);
    const [sheetHeight, setSheetHeight] = useState(FALLBACK_OFFSET);
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setMounted(true);
            Animated.timing(progress, {
                toValue: 1,
                duration: OPEN_DURATION,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        } else if (mounted) {
            Animated.timing(progress, {
                toValue: 0,
                duration: CLOSE_DURATION,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) setMounted(false);
            });
        }
    }, [visible, mounted, progress]);

    if (!mounted) {
        return null;
    }

    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [sheetHeight, 0],
    });

    return (
        <Modal visible transparent animationType="none" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={styles.flex} onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: progress }]} />
                </Pressable>
                <Animated.View
                    style={[styles.sheet, { transform: [{ translateY }] }]}
                    onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
                >
                    {/* Swallow taps inside the sheet so they don't reach the backdrop */}
                    <Pressable onPress={() => {}}>
                        <Animated.View style={styles.handle} />
                        {children}
                    </Pressable>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    sheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.surface.card,
        borderTopLeftRadius: radius.card,
        borderTopRightRadius: radius.card,
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
