import { StyleSheet, Text, View } from "react-native";

interface Props {
    label: string;
    current: number;
    goal: number;
    color: string;
}

export function MacroProgressBar({ label, current, goal, color }: Props) {
    const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
    const isOver = goal > 0 && current > goal;

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={[styles.values, isOver && styles.over]}>
                    {Math.round(current)} / {Math.round(goal)} г
                </Text>
            </View>
            <View style={styles.track}>
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${Math.round(progress * 100)}%`,
                            backgroundColor: isOver ? "#ef4444" : color,
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    label: {
        fontSize: 13,
        color: "#666",
    },
    values: {
        fontSize: 13,
        color: "#333",
    },
    over: {
        color: "#ef4444",
    },
    track: {
        height: 6,
        backgroundColor: "#e5e5e5",
        borderRadius: 3,
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        borderRadius: 3,
    },
});
