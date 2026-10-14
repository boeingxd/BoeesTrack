import { ownPart } from "./shares";
import type { Entry } from "./types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

export function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
}

export function dayKey(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function timeLabel(d: Date): string {
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function shortDay(d: Date): string {
	return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function dayMonth(d: Date): string {
	return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function weekdayName(index: number): string {
	return WEEKDAYS_FULL[index];
}

// Weeks run Monday to Sunday.
export function startOfWeek(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
}

export function dayDiff(d: Date, today: Date): number {
	return Math.round((startOfDay(today).getTime() - startOfDay(d).getTime()) / DAY_MS);
}

export function dayTitle(d: Date, today: Date): string {
	const diff = dayDiff(d, today);
	if (diff === 0) return `Today · ${shortDay(d)}`;
	if (diff === 1) return `Yesterday · ${shortDay(d)}`;
	return shortDay(d);
}

export function whenLabel(d: Date, today: Date): string {
	const diff = dayDiff(d, today);
	const day = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : WEEKDAYS[d.getDay()];
	return `${day}, ${d.getDate()} ${MONTHS[d.getMonth()]} · ${timeLabel(d)}`;
}

export function monthTitle(d: Date): string {
	return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// Value format of <input type="datetime-local">, in local time.
export function toInputValue(d: Date): string {
	return `${dayKey(d)}T${timeLabel(d)}`;
}

export function daysLeftInMonth(today: Date): number {
	const total = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
	return total - today.getDate() + 1;
}

export function sameMonth(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export type DayGroup = {
	key: string;
	date: Date;
	entries: Entry[];
	spent: number;
};

// One group per calendar day from the newest day down to the oldest, so a day with nothing in it still shows as a blank page.
export function groupByDay(entries: Entry[], today: Date): DayGroup[] {
	const todayStart = startOfDay(today).getTime();
	const times = entries.map((e) => startOfDay(e.at).getTime());
	const newest = Math.max(todayStart, ...times);
	const oldest = Math.min(todayStart, ...times);

	const byDay = new Map<string, Entry[]>();
	for (const entry of entries) {
		const key = dayKey(entry.at);
		byDay.set(key, [...(byDay.get(key) ?? []), entry]);
	}

	const groups: DayGroup[] = [];
	for (let t = newest; t >= oldest; t -= DAY_MS) {
		const date = new Date(t);
		const key = dayKey(date);
		const list = (byDay.get(key) ?? []).sort((a, b) => b.at.getTime() - a.at.getTime());
		const spent = list.filter((e) => e.kind === "spent").reduce((sum, e) => sum + ownPart(e), 0);
		groups.push({ key, date, entries: list, spent });
	}
	return groups;
}

export function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
	return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// "2026-10": sortable, and cheap to compare or store in a filter.
export function monthKey(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthFromKey(key: string): Date {
	const [year, month] = key.split("-").map(Number);
	return new Date(year, month - 1, 1);
}
