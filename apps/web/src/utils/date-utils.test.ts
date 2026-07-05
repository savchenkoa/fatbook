import { describe, it, expect } from "vitest";
import { formatDate, getNextDay, getPrevDay, isToday, isYesterday, now, parse } from "@fatbook/shared";

describe("date-utils", () => {
    it("round-trips formatDate/parse without producing an invalid date", () => {
        const today = formatDate(now());
        const parsed = parse(today);

        expect(Number.isNaN(parsed.getTime())).toBe(false);
        expect(formatDate(parsed)).toBe(today);
    });

    it("keeps getNextDay/getPrevDay valid across a formatDate/parse round-trip", () => {
        const today = formatDate(now());
        const tomorrow = formatDate(getNextDay(parse(today)));
        const yesterday = formatDate(getPrevDay(parse(today)));

        expect(tomorrow).not.toBe("Invalid Date");
        expect(yesterday).not.toBe("Invalid Date");
        expect(formatDate(getPrevDay(parse(tomorrow)))).toBe(today);
        expect(formatDate(getNextDay(parse(yesterday)))).toBe(today);
    });

    it("isToday/isYesterday accept the same formatted-string shape produced by formatDate", () => {
        const today = formatDate(now());
        const yesterday = formatDate(getPrevDay(parse(today)));

        expect(isToday(today)).toBe(true);
        expect(isYesterday(yesterday)).toBe(true);
    });
});
