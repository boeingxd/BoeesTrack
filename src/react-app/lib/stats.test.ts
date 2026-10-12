import { describe, expect, it } from "vitest";
import { addMonths, monthFromKey, monthKey } from "./dates";
import {
	categoryBreakdown,
	dailyTotals,
	defaultFilters,
	filterEntries,
	flows,
	monthWeeks,
	habits,
	NO_CATEGORY,
	periodRange,
	previousRange,
	shiftAnchor,
	sortEntries,
	topSpends,
} from "./stats";
import type { Entry } from "./types";

let n = 0;
function entry(partial: Partial<Entry> & { baht: number }): Entry {
	const { baht, ...rest } = partial;
	n += 1;
	return {
		id: `e${n}`,
		kind: "spent",
		satang: baht * 100,
		at: new Date(2026, 9, 8, 12, 0),
		category: null,
		note: "",
		...rest,
	};
}

const entries = [
	entry({ baht: 120, category: "Food & drink", note: "Lunch" }),
	entry({ baht: 80, category: "Food & drink", note: "Iced coffee" }),
	entry({ baht: 420, category: "Hangouts", note: "Dinner with friends" }),
	entry({ baht: 60 }),
	entry({ baht: 2500, kind: "received", note: "Allowance" }),
	entry({ baht: 1000, kind: "saved", note: "Monthly goal" }),
	entry({ baht: 1200, category: "Shopping", note: "Headphones", at: new Date(2026, 8, 20, 12, 0) }),
];

describe("month keys", () => {
	it("round-trips and steps months, including across a year", () => {
		expect(monthKey(new Date(2026, 9, 31))).toBe("2026-10");
		expect(monthFromKey("2026-10").getMonth()).toBe(9);
		expect(monthKey(addMonths(new Date(2026, 0, 15), -1))).toBe("2025-12");
	});
});

describe("categoryBreakdown", () => {
	const { total, count, rows } = categoryBreakdown(entries, periodRange("month", new Date(2026, 9, 8)));

	it("counts only spent entries from that month", () => {
		expect(total).toBe((120 + 80 + 420 + 60) * 100);
		expect(count).toBe(4);
	});

	it("sorts the biggest category first and groups untagged spending", () => {
		expect(rows.map((row) => row.category)).toEqual(["Hangouts", "Food & drink", NO_CATEGORY]);
		expect(rows[1]).toMatchObject({ satang: 20_000, count: 2 });
	});

	it("gives shares that add up to the whole", () => {
		expect(rows.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1);
	});

	it("returns nothing for a month with no spending", () => {
		expect(categoryBreakdown(entries, periodRange("month", new Date(2026, 0, 8)))).toEqual({ total: 0, count: 0, rows: [] });
	});
});

describe("periodRange", () => {
	// 2026-10-11 is a Sunday.
	const sunday = new Date(2026, 9, 11, 15, 0);

	it("covers one day, the Monday-to-Sunday week, and the calendar month", () => {
		expect(periodRange("day", sunday)).toEqual({ from: new Date(2026, 9, 11), to: new Date(2026, 9, 12) });
		expect(periodRange("week", sunday)).toEqual({ from: new Date(2026, 9, 5), to: new Date(2026, 9, 12) });
		expect(periodRange("month", sunday)).toEqual({ from: new Date(2026, 9, 1), to: new Date(2026, 10, 1) });
	});

	it("steps back and forward across month and year edges", () => {
		expect(shiftAnchor("day", new Date(2026, 0, 1), -1).getFullYear()).toBe(2025);
		expect(periodRange("week", shiftAnchor("week", new Date(2026, 9, 1), -1)).from).toEqual(new Date(2026, 8, 21));
		expect(periodRange("month", shiftAnchor("month", new Date(2026, 0, 15), -1)).from).toEqual(new Date(2025, 11, 1));
	});
});

describe("previousRange", () => {
	it("compares a running month with the same number of days last month", () => {
		const { range, partial } = previousRange("month", new Date(2026, 9, 3), new Date(2026, 9, 3, 18, 0));
		expect(partial).toBe(true);
		expect(range).toEqual({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 4) });
	});

	it("uses the whole earlier period once the period is over", () => {
		const { range, partial } = previousRange("month", new Date(2026, 8, 10), new Date(2026, 9, 11));
		expect(partial).toBe(false);
		expect(range).toEqual({ from: new Date(2026, 7, 1), to: new Date(2026, 8, 1) });
	});

	it("does not clip a day or a finished week", () => {
		expect(previousRange("day", new Date(2026, 9, 11), new Date(2026, 9, 11, 9, 0)).partial).toBe(false);
		expect(previousRange("week", new Date(2026, 9, 11), new Date(2026, 9, 11, 9, 0)).partial).toBe(false);
	});
});

describe("dailyTotals and topSpends", () => {
	const week = periodRange("week", new Date(2026, 9, 8));

	it("gives one total per day, spent entries only, with empty days included", () => {
		const days = dailyTotals(entries, week);
		expect(days).toHaveLength(7);
		expect(days[3].satang).toBe((120 + 80 + 420 + 60) * 100);
		expect(days[0].satang).toBe(0);
	});

	it("lists the biggest spends first", () => {
		expect(topSpends(entries, periodRange("month", new Date(2026, 9, 8)), 2).map((e) => e.satang)).toEqual([42_000, 12_000]);
	});
});

describe("habits", () => {
	const today = new Date(2026, 9, 8, 20, 0);
	const month = periodRange("month", today);

	it("averages over the days that have happened", () => {
		expect(habits(entries, month, today).avgPerDay).toBe(8_500);
	});
});

describe("filterEntries", () => {
	const all = defaultFilters(new Date(2026, 9, 8));

	it("shows the month it opens on and nothing from other months", () => {
		expect(filterEntries(entries, all)).toHaveLength(entries.length - 1);
	});

	it("narrows to the day, week or month being looked at", () => {
		expect(filterEntries(entries, { ...all, anchor: new Date(2026, 8, 3) })).toHaveLength(1);
		expect(filterEntries(entries, { ...all, scale: "week", anchor: new Date(2026, 8, 16) })).toHaveLength(1);
		expect(filterEntries(entries, { ...all, scale: "week", anchor: new Date(2026, 8, 21) })).toHaveLength(0);
		expect(filterEntries(entries, { ...all, scale: "day", anchor: new Date(2026, 9, 8) })).toHaveLength(entries.length - 1);
	});

	it("searches all time once something is typed", () => {
		expect(filterEntries(entries, { ...all, query: "headphones" })).toHaveLength(1);
		expect(filterEntries(entries, { ...all, query: "  " })).toHaveLength(entries.length - 1);
	});

	it("narrows by category, with a way to ask for untagged spending", () => {
		expect(filterEntries(entries, { ...all, category: "Food & drink" })).toHaveLength(2);
		const untagged = filterEntries(entries, { ...all, category: NO_CATEGORY });
		expect(untagged).toHaveLength(1);
		expect(untagged[0].satang).toBe(6_000);
	});

	it("narrows by kind", () => {
		expect(filterEntries(entries, { ...all, kind: "received" })).toHaveLength(1);
	});

	it("searches notes and categories without caring about case", () => {
		expect(filterEntries(entries, { ...all, query: "COFFEE" })).toHaveLength(1);
		expect(filterEntries(entries, { ...all, query: "hangouts" })).toHaveLength(1);
	});

	it("searches amounts however they are typed", () => {
		expect(filterEntries(entries, { ...all, query: "120" }).map((e) => e.note)).toContain("Lunch");
		expect(filterEntries(entries, { ...all, query: "฿420" })).toHaveLength(1);
		expect(filterEntries(entries, { ...all, query: "1,200" })).toHaveLength(1);
		expect(filterEntries(entries, { ...all, query: "1200" })).toHaveLength(1);
	});

	it("finds received and saved entries by their kind word", () => {
		expect(filterEntries(entries, { ...all, query: "saved" })).toHaveLength(1);
	});

	it("combines filters", () => {
		const hit = filterEntries(entries, { ...all, query: "lunch", category: "Food & drink", kind: "spent" });
		expect(hit).toHaveLength(1);
	});
});

describe("flows", () => {
	const range = periodRange("month", new Date(2026, 9, 15));

	it("totals received, spent and saved inside the period", () => {
		const list = [
			entry({ baht: 2_500, kind: "received" }),
			entry({ baht: 100 }),
			entry({ baht: 50, pot: "Trip" }),
			entry({ baht: 300, kind: "saved", pot: "Trip" }),
		];
		expect(flows(list, range)).toEqual({ received: 250_000, spent: 15_000, saved: 30_000 });
	});

	it("ignores adjustments and entries outside the period", () => {
		const list = [
			entry({ baht: 800, kind: "adjust" }),
			entry({ baht: 400, kind: "saved", pot: "Trip", at: new Date(2026, 8, 30, 23, 59) }),
			entry({ baht: 70, kind: "saved", pot: "Trip", at: new Date(2026, 9, 1, 0, 0) }),
		];
		expect(flows(list, range)).toEqual({ received: 0, spent: 0, saved: 7_000 });
	});
});

describe("sortEntries", () => {
	const a = entry({ baht: 50, at: new Date(2026, 9, 1, 9, 0) });
	const b = entry({ baht: 300, at: new Date(2026, 9, 2, 9, 0) });
	const c = entry({ baht: 100, kind: "adjust", satang: -40_000, at: new Date(2026, 9, 3, 9, 0) });
	const list = [a, b, c];

	it("orders by time", () => {
		expect(sortEntries(list, "newest")).toEqual([c, b, a]);
		expect(sortEntries(list, "oldest")).toEqual([a, b, c]);
	});

	it("orders by size, counting a negative adjustment by its absolute value", () => {
		expect(sortEntries(list, "biggest")).toEqual([c, b, a]);
		expect(sortEntries(list, "smallest")).toEqual([a, b, c]);
	});

	it("leaves the input alone", () => {
		sortEntries(list, "biggest");
		expect(list).toEqual([a, b, c]);
	});
});

describe("monthWeeks", () => {
	// October 2026 starts on a Thursday, so the first week is short (Thu to Sun).
	const days = dailyTotals(entries, periodRange("month", new Date(2026, 9, 8)));
	const weeks = monthWeeks(days, new Date(2026, 9, 8));

	it("cuts the month into Monday-to-Sunday runs, short at the edges", () => {
		expect(weeks.map((w) => w.days.length)).toEqual([4, 7, 7, 7, 6]);
	});

	it("keeps every day and every satang", () => {
		expect(weeks.flatMap((w) => w.days)).toHaveLength(days.length);
		expect(weeks.reduce((sum, w) => sum + w.satang, 0)).toBe(days.reduce((sum, d) => sum + d.satang, 0));
	});

	it("marks weeks that start after today", () => {
		expect(weeks.map((w) => w.future)).toEqual([false, false, true, true, true]);
	});
});
