import { addDays, addMonths, dayKey, monthKey, startOfDay, startOfMonth, startOfWeek } from "./dates";
import { formatBaht } from "./money";
import type { Entry, Kind } from "./types";

export const NO_CATEGORY = "No category";

export type Filters = {
	query: string;
	category: string | null;
	kind: "all" | Kind;
	month: string | null;
};

export function defaultFilters(month: string | null): Filters {
	return { query: "", category: null, kind: "all", month };
}

export type Scale = "day" | "week" | "month";

// `to` is exclusive: the first instant of the next period.
export type Range = { from: Date; to: Date };

const DAY_MS = 86_400_000;
const daysIn = (range: Range) => Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS);

export function periodRange(scale: Scale, anchor: Date): Range {
	if (scale === "day") {
		const from = startOfDay(anchor);
		return { from, to: addDays(from, 1) };
	}
	if (scale === "week") {
		const from = startOfWeek(anchor);
		return { from, to: addDays(from, 7) };
	}
	const from = startOfMonth(anchor);
	return { from, to: addMonths(from, 1) };
}

export function shiftAnchor(scale: Scale, anchor: Date, n: number): Date {
	if (scale === "day") return addDays(anchor, n);
	if (scale === "week") return addDays(anchor, n * 7);
	return addMonths(anchor, n);
}

// The period before this one. While this period is still running, only the same number of days is
// compared, so day 3 of a month is not measured against all of last month.
export function previousRange(scale: Scale, anchor: Date, today: Date): { range: Range; partial: boolean } {
	const current = periodRange(scale, anchor);
	const before = periodRange(scale, shiftAnchor(scale, current.from, -1));
	const running = current.from.getTime() <= today.getTime() && today.getTime() < current.to.getTime();
	if (!running) return { range: before, partial: false };

	const elapsed = daysIn({ from: current.from, to: startOfDay(today) }) + 1;
	const to = addDays(before.from, elapsed);
	return to.getTime() < before.to.getTime() ? { range: { from: before.from, to }, partial: true } : { range: before, partial: false };
}

const inRange = (entry: Entry, range: Range) => entry.at.getTime() >= range.from.getTime() && entry.at.getTime() < range.to.getTime();
const spentIn = (entries: Entry[], range: Range) => entries.filter((entry) => entry.kind === "spent" && inRange(entry, range));
const sum = (entries: Entry[]) => entries.reduce((total, entry) => total + entry.satang, 0);

export const totalSpent = (entries: Entry[], range: Range) => sum(spentIn(entries, range));

// Money moving in a period: what came in, what went out, what was set aside. Adjustments are corrections, not flows.
export function flows(entries: Entry[], range: Range) {
	const inside = entries.filter((entry) => inRange(entry, range));
	const by = (kind: Entry["kind"]) => sum(inside.filter((entry) => entry.kind === kind));
	return { received: by("received"), spent: by("spent"), saved: by("saved") };
}

export type CategoryRow = {
	category: string;
	satang: number;
	count: number;
	share: number;
	// What the same category came to in the earlier range, when one is given.
	before: number;
};

// Where the money went in one period: spent entries only, biggest category first.
export function categoryBreakdown(entries: Entry[], range: Range, earlier?: Range) {
	const groups = new Map<string, { satang: number; count: number }>();
	let total = 0;

	for (const entry of spentIn(entries, range)) {
		const key = entry.category ?? NO_CATEGORY;
		const group = groups.get(key) ?? { satang: 0, count: 0 };
		group.satang += entry.satang;
		group.count += 1;
		groups.set(key, group);
		total += entry.satang;
	}

	const before = new Map<string, number>();
	if (earlier) {
		for (const entry of spentIn(entries, earlier)) {
			const key = entry.category ?? NO_CATEGORY;
			before.set(key, (before.get(key) ?? 0) + entry.satang);
		}
	}

	const rows: CategoryRow[] = [...groups]
		.map(([category, { satang, count }]) => ({
			category,
			satang,
			count,
			share: total === 0 ? 0 : satang / total,
			before: before.get(category) ?? 0,
		}))
		.sort((a, b) => b.satang - a.satang || a.category.localeCompare(b.category));

	return { total, count: rows.reduce((n, row) => n + row.count, 0), rows };
}

export type DayTotal = { date: Date; key: string; satang: number };

// One total per calendar day in the range, including days with nothing spent.
export function dailyTotals(entries: Entry[], range: Range): DayTotal[] {
	const byDay = new Map<string, number>();
	for (const entry of spentIn(entries, range)) {
		const key = dayKey(entry.at);
		byDay.set(key, (byDay.get(key) ?? 0) + entry.satang);
	}
	return Array.from({ length: daysIn(range) }, (_, i) => {
		const date = addDays(range.from, i);
		const key = dayKey(date);
		return { date, key, satang: byDay.get(key) ?? 0 };
	});
}

export function topSpends(entries: Entry[], range: Range, n = 3): Entry[] {
	return spentIn(entries, range)
		.sort((a, b) => b.satang - a.satang || b.at.getTime() - a.at.getTime())
		.slice(0, n);
}

const wholeBaht = (satang: number) => Math.round(satang / 100) * 100;

export type Habits = {
	avgPerDay: number;
	busiest: { weekday: number; satang: number } | null;
	riser: { category: string; delta: number } | null;
};

// Habits over the days that have happened so far. The busiest weekday is by average, so a weekday
// that occurs five times in a month does not win just for appearing more often.
export function habits(entries: Entry[], range: Range, earlier: Range, today: Date): Habits {
	const elapsed = dailyTotals(entries, range).filter((day) => day.date.getTime() <= today.getTime());
	const total = elapsed.reduce((n, day) => n + day.satang, 0);

	const byWeekday = new Map<number, { satang: number; days: number }>();
	for (const day of elapsed) {
		const slot = byWeekday.get(day.date.getDay()) ?? { satang: 0, days: 0 };
		slot.satang += day.satang;
		slot.days += 1;
		byWeekday.set(day.date.getDay(), slot);
	}
	let busiest: Habits["busiest"] = null;
	for (const [weekday, { satang, days }] of byWeekday) {
		const average = wholeBaht(satang / days);
		if (average > 0 && (busiest === null || average > busiest.satang)) busiest = { weekday, satang: average };
	}

	const { rows } = categoryBreakdown(entries, range, earlier);
	const hadEarlier = totalSpent(entries, earlier) > 0;
	const grown = rows
		.map((row) => ({ category: row.category, delta: row.satang - row.before }))
		.filter((row) => row.delta > 0)
		.sort((a, b) => b.delta - a.delta || a.category.localeCompare(b.category));

	return {
		avgPerDay: elapsed.length === 0 ? 0 : wholeBaht(total / elapsed.length),
		busiest,
		riser: hadEarlier ? (grown[0] ?? null) : null,
	};
}

// Lower-case and drop thousands commas, so "1,200", "1200" and "฿1,200" all find the same entry.
const normalise = (text: string) => text.toLowerCase().replace(/,/g, "");

function haystack(entry: Entry): string {
	const label = entry.kind === "spent" ? (entry.category ?? NO_CATEGORY) : entry.kind;
	return normalise([label, entry.note, String(entry.satang / 100), formatBaht(entry.satang)].join(" "));
}

export function filterEntries(entries: Entry[], filters: Filters): Entry[] {
	const query = normalise(filters.query.trim());

	return entries.filter((entry) => {
		if (filters.month !== null && monthKey(entry.at) !== filters.month) return false;
		if (filters.kind !== "all" && entry.kind !== filters.kind) return false;
		if (filters.category !== null) {
			const wanted = filters.category === NO_CATEGORY ? null : filters.category;
			if (entry.kind !== "spent" || entry.category !== wanted) return false;
		}
		return query === "" || haystack(entry).includes(query);
	});
}
