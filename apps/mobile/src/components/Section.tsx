import { Children, cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { ViewStyle } from "react-native";

type Position = "single" | "first" | "middle" | "last";

interface Props {
    children: ReactNode;
    style?: ViewStyle;
}

/**
 * Groups stacked cards into one visual section: big outer corners, small (8)
 * inner corners between rows, 2px hairline gap — the app-wide grouping pattern
 * (see the meal list on Home).
 *
 * Injects `position` into each child, so children must be components that accept
 * it and round their corners accordingly (`Card`, `ListItem`). A lone child
 * stays fully rounded (`single`).
 */
export function Section({ children, style }: Props) {
    const items = Children.toArray(children).filter(isValidElement) as ReactElement<{
        position?: Position;
    }>[];
    const count = items.length;

    return (
        <View style={[styles.group, style]}>
            {items.map((child, index) => {
                const position: Position =
                    count === 1
                        ? "single"
                        : index === 0
                          ? "first"
                          : index === count - 1
                            ? "last"
                            : "middle";
                return cloneElement(child, { key: child.key ?? index, position });
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    group: {
        gap: 2,
    },
});
