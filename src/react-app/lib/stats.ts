import { addDays, addMonths, dayKey, dayMonth, dayTitle, monthTitle, startOfDay, startOfMonth, startOfWeek } from "./dates";
import { formatBaht } from "./money";
import type { Entry, Kind } from "./types";

export const NO_CATEGORY = "No category";

export type Scale = "day" | "week" | "month";
export type Sort = "newest" | "oldest" | "biggest" | "smallest";

// The period (scale + anchor) is what History is showing; a typed query ignores it and searches all time.
export type Filters = {
	query: string;
	category: string | null;
	kind: "all" | Kind;
	source: "all" | "slips" | "manual";
	scale: Scale;
	anchor: Date;
	sort: Sort;
};

export function defaultFilters(today: Date): Filters {
	return { query: "", category: null, kind: "all", source: "all", scale: "month", anchor: today, sort: "newest" };
}

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

export function periodTitle(scale: Scale, range: Range, today: Date): string {
	if (scale === "day") return dayTitle(range.from, today);
	if (scale === "month") return monthTitle(range.from);
	return `${dayMonth(range.from)} – ${dayMonth(addDays(range.to, -1))}`;
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
};

// Habits over the days that have happened so far.
export function habits(entries: Entry[], range: Range, today: Date): Habits {
	const elapsed = dailyTotals(entries, range).filter((day) => day.date.getTime() <= today.getTime());
	const total = elapsed.reduce((n, day) => n + day.satang, 0);
	return { avgPerDay: elapsed.length === 0 ? 0 : wholeBaht(total / elapsed.length) };
}

// Lower-case and drop thousands commas, so "1,200", "1200" and "฿1,200" all find the same entry.
const normalise = (text: string) => text.toLowerCase().replace(/,/g, "");

function haystack(entry: Entry): string {
	const label = entry.kind === "spent" ? (entry.category ?? NO_CATEGORY) : entry.kind;
	return normalise([label, entry.note, String(entry.satang / 100), formatBaht(entry.satang)].join(" "));
}

export function filterEntries(entries: Entry[], filters: Filters): Entry[] {
	const query = normalise(filters.query.trim());
	const range = query === "" ? periodRange(filters.scale, filters.anchor) : null;

	return entries.filter((entry) => {
		if (range && !inRange(entry, range)) return false;
		if (filters.kind !== "all" && entry.kind !== filters.kind) return false;
		// A slip is told by its reference, not by whether its picture is still stored.
		if (filters.source !== "all" && Boolean(entry.slipRef) !== (filters.source === "slips")) return false;
		if (filters.category !== null) {
			const wanted = filters.category === NO_CATEGORY ? null : filters.category;
			if (entry.kind !== "spent" || entry.category !== wanted) return false;
		}
		return query === "" || haystack(entry).includes(query);
	});
}

// Biggest and smallest rank by size, so a negative adjustment counts by how far it moves the balance.
export function sortEntries(entries: Entry[], sort: Sort): Entry[] {
	const byTime = (a: Entry, b: Entry) => b.at.getTime() - a.at.getTime();
	const size = (e: Entry) => Math.abs(e.satang);
	const order: Record<Sort, (a: Entry, b: Entry) => number> = {
		newest: byTime,
		oldest: (a, b) => -byTime(a, b),
		biggest: (a, b) => size(b) - size(a) || byTime(a, b),
		smallest: (a, b) => size(a) - size(b) || byTime(a, b),
	};
	return [...entries].sort(order[sort]);
}

export type MonthWeek = { key: string; days: DayTotal[]; satang: number; share: number; future: boolean };

// A month's days cut into Monday-to-Sunday runs (the first and last can be short); a week that starts after today is "future".
export function monthWeeks(days: DayTotal[], today: Date): MonthWeek[] {
	const total = days.reduce((sum, day) => sum + day.satang, 0);
	const runs = new Map<string, DayTotal[]>();
	for (const day of days) {
		const key = dayKey(startOfWeek(day.date));
		runs.set(key, [...(runs.get(key) ?? []), day]);
	}
	return Array.from(runs, ([key, run]) => {
		const satang = run.reduce((sum, day) => sum + day.satang, 0);
		return { key, days: run, satang, share: total === 0 ? 0 : satang / total, future: run[0].date.getTime() > today.getTime() };
	});
}
