import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type DayjsArgType = dayjs.ConfigType;

const DEFAULT_DATE_FORMAT = "DD-MMM-YYYY";

export function now() {
    return dayjs().toDate().getTime();
}

export function nowAsDate() {
    return dayjs().toDate();
}

export function parse(dateStr: string) {
    return dayjs(dateStr, DEFAULT_DATE_FORMAT).toDate();
}

export function formatDate(date: DayjsArgType, format = DEFAULT_DATE_FORMAT) {
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
    const normalized = typeof date === "string" ? parse(date) : date;
    return dayjs(normalized).isSame(now(), "day");
}

export function isYesterday(date: DayjsArgType): boolean {
    const normalized = typeof date === "string" ? parse(date) : date;
    const yesterday = subtractDays(now(), 1);
    return dayjs(normalized).isSame(yesterday, "day");
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
