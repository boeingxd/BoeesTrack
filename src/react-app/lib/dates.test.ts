import { describe, expect, it } from "vitest";
import { dayTitle, daysLeftInMonth, groupByDay, whenLabel } from "./dates";
import type { Entry } from "./types";

const today = new Date(2026, 9, 8, 14, 0);

function entry(day: number, hour: number, kind: Entry["kind"] = "spent", baht = 100): Entry {
	return {
		id: `${day}-${hour}-${kind}`,
		kind,
		satang: baht * 100,
		at: new Date(2026, 9, day, hour, 0),
		category: null,
		note: "",
	};
}

describe("labels", () => {
	it("names today and yesterday and falls back to the weekday", () => {
		expect(dayTitle(new Date(2026, 9, 8), today)).toBe("Today · Thu 8 Oct");
		expect(dayTitle(new Date(2026, 9, 7), today)).toBe("Yesterday · Wed 7 Oct");
		expect(dayTitle(new Date(2026, 9, 3), today)).toBe("Sat 3 Oct");
	});

	it("labels when something happened", () => {
		expect(whenLabel(new Date(2026, 9, 8, 23, 21), today)).toBe("Today, 8 Oct · 23:21");
	});

	it("counts the days left in the month including today", () => {
		expect(daysLeftInMonth(today)).toBe(24);
		expect(daysLeftInMonth(new Date(2026, 1, 28))).toBe(1);
	});
});

describe("groupByDay", () => {
	it("starts at today even when today is empty", () => {
		const groups = groupByDay([entry(7, 10)], today);
		expect(groups.map((g) => g.key)).toEqual(["2026-10-08", "2026-10-07"]);
		expect(groups[0].entries).toEqual([]);
	});

	it("keeps empty days between entries as blank pages", () => {
		const groups = groupByDay([entry(8, 9), entry(5, 9)], today);
		expect(groups.map((g) => g.key)).toEqual(["2026-10-08", "2026-10-07", "2026-10-06", "2026-10-05"]);
		expect(groups[1].entries).toHaveLength(0);
	});

	it("sorts a day newest first and sums only spent entries", () => {
		const [day] = groupByDay([entry(8, 9, "spent", 50), entry(8, 12, "spent", 70), entry(8, 10, "received", 500)], today);
		expect(day.entries.map((e) => e.at.getHours())).toEqual([12, 10, 9]);
		expect(day.spent).toBe(12_000);
	});
});
