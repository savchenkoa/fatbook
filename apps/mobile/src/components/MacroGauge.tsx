import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const GAUGE_SIZE = 88;
const STROKE_WIDTH = 8;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CX = GAUGE_SIZE / 2;

interface Props {
    label: string;
    current: number;
    goal: number;
    color: string;
}

export function MacroGauge({ label, current, goal, color }: Props) {
    const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    return (
        <View style={styles.container}>
            <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
                <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
                    <Circle
                        cx={CX}
                        cy={CX}
                        r={RADIUS}
                        stroke="#E5E7EB"
                        strokeWidth={STROKE_WIDTH}
                        fill="none"
                    />
                    <Circle
                        cx={CX}
                        cy={CX}
                        r={RADIUS}
                        stroke={progress > 0 ? color : "transparent"}
                        strokeWidth={STROKE_WIDTH}
                        fill="none"
                        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform={`rotate(-90, ${CX}, ${CX})`}
                    />
                </Svg>
                <View style={StyleSheet.absoluteFill}>
                    <View style={styles.textContainer}>
                        <Text style={styles.value}>{Math.round(current)}</Text>
                        <Text style={styles.goal}>/ {Math.round(goal)} г</Text>
                    </View>
                </View>
            </View>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        flex: 1,
    },
    textContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    value: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    goal: {
        fontSize: 10,
        color: "#9CA3AF",
    },
    label: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 6,
    },
});
