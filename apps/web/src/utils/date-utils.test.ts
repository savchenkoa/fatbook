import { describe, it, expect } from "vitest";
import { formatDate, getNextDay, getPrevDay, isToday, isYesterday, now, parse } from "@fatbook/shared";

describe("date-utils", () => {
    it("formats ISO API dates and timestamps for the existing UI", () => {
        expect(formatDate("2026-10-18")).toBe("18-Oct-2026");
        expect(formatDate("2026-10-18T12:00:00", "DD MMM YYYY")).toBe("18 Oct 2026");
        expect(formatDate("2026-10-18T12:00:00Z", "YYYY")).toBe("2026");
        expect(formatDate("18-Oct-2026", "YYYY-MM-DD")).toBe("2026-10-18");
    });

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
