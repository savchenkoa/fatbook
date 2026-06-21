import dayjs from "dayjs";

type DayjsArgType = dayjs.ConfigType;

export function now() {
    return dayjs().toDate().getTime();
}

export function nowAsDate() {
    return dayjs().toDate();
}

export function parse(dateStr: string) {
    return dayjs(dateStr).toDate();
}

export function formatDate(date: DayjsArgType, format = "DD-MMM-YYYY") {
    if (typeof date === "string") {
        date = parse(date);
    }
    return dayjs(date).format(format);
}

export function getNextDay(date: Date) {
    return dayjs(date).add(1, "day").toDate();
}

export function getPrevDay(date: Date) {
    return dayjs(date).subtract(1, "day").toDate();
}

export function subtractDays(date: DayjsArgType, amount: number) {
    return dayjs(date).subtract(amount, "day").toDate();
}

export function isToday(date: DayjsArgType): boolean {
    return dayjs(date).isSame(now(), "day");
}

export function isYesterday(date: DayjsArgType): boolean {
    const yesterday = subtractDays(now(), 1);
    return dayjs(date).isSame(yesterday, "day");
}

export function getDaysBetween(start: Date, end: Date) {
    const result: string[] = [];

    let date = start;
    while (date <= end) {
        result.push(formatDate(date, "YYYY-MM-DD"));
        date = getNextDay(date);
    }

    return result;
}
