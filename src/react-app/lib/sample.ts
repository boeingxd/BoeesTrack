import { addDays, dayKey } from "./dates";
import type { Entry, Kind, Slip } from "./types";

// Everything in this file is synthetic sample data for the first design pass.
// Amounts echo the real slips; names, notes and reference numbers are invented.

export const SAMPLE_BUDGET = 20_000 * 100;

export const DEFAULT_CATEGORIES = [
	"Food & drink",
	"Groceries",
	"Transport",
	"Shopping",
	"Leisure",
	"Hangouts",
	"Bills",
	"Health",
	"Education",
	"Other",
];

type Row = [time: string, category: string | null, note: string, baht: number, kind?: Kind];

const DAYS: Record<number, Row[]> = {
	0: [
		["07:48", "Transport", "BTS", 44],
		["09:20", "Food & drink", "Iced coffee", 85],
		["12:35", "Food & drink", "Lunch", 135],
	],
	1: [
		["08:05", "Transport", "Grab to uni", 96],
		["12:50", "Food & drink", "Lunch", 110],
		["19:40", "Hangouts", "Dinner with friends", 420],
	],
	2: [],
	3: [
		["07:30", "Transport", "BTS", 44],
		["08:10", "Food & drink", "Breakfast", 55],
		["09:45", "Food & drink", "Iced tea", 35],
		["10:30", "Education", "Printing", 40],
		["11:15", "Food & drink", "Snack", 25],
		["12:20", "Food & drink", "Lunch", 120],
		["13:00", "Food & drink", "Water", 15],
		["14:40", "Shopping", "Notebook", 89],
		["15:25", "Transport", "Motorbike taxi", 40],
		["16:10", "Leisure", "Arcade", 100],
		["17:05", "Food & drink", "Bubble tea", 65],
		["18:30", "Hangouts", "Street food", 210],
		["19:15", "Hangouts", "Dessert", 95],
		["20:00", "Transport", "Grab home", 110],
		["21:10", "Groceries", "Milk and bread", 72],
		["22:05", "Health", "Vitamins", 180],
	],
	4: [
		["09:00", null, "Allowance", 2500, "received"],
		["10:15", "Groceries", "7-Eleven", 118],
		["13:05", "Food & drink", "Lunch", 95],
		["15:30", "Education", "Course reader", 260],
		["21:00", null, "Monthly goal", 1000, "saved"],
	],
	5: [
		["12:40", "Food & drink", "Lunch", 105],
		["18:20", "Bills", "Phone top-up", 300],
		["20:45", "Leisure", "Cinema", 220],
	],
	6: [
		["08:10", "Transport", "BTS", 44],
		["12:55", "Food & drink", "Lunch", 125],
		["16:00", "Shopping", "Phone case", 350],
		["19:30", "Hangouts", "Board game cafe", 280],
	],
	7: [
		["11:30", "Food & drink", "Brunch", 190],
		["14:20", "Transport", "Grab", 88],
		["17:45", "Groceries", "Market", 240],
	],
	8: [
		["12:15", "Food & drink", "Lunch", 100],
		["15:50", "Health", "Pharmacy", 140],
	],
	9: [
		["09:30", null, "From family", 1500, "received"],
		["13:00", "Food & drink", "Lunch", 115],
		["18:10", "Hangouts", "Dinner", 330],
	],
};

function at(today: Date, daysAgo: number, time: string): Date {
	const [h, m] = time.split(":").map(Number);
	const d = addDays(today, -daysAgo);
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
}

export function sampleEntries(today: Date): Entry[] {
	return Object.entries(DAYS).flatMap(([offset, rows]) =>
		rows.map(([time, category, note, baht, kind = "spent"], i) => ({
			id: `sample-${offset}-${i}`,
			kind,
			satang: baht * 100,
			at: at(today, Number(offset), time),
			category,
			note,
		})),
	);
}

// A real slip's reference starts with its timestamp (YYYYMMDDHHMMSS); the tail here is invented.
function refFor(d: Date, tail: string): string {
	const stamp = `${dayKey(d).replace(/-/g, "")}${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}27`;
	return `${stamp}${tail}`;
}

export function sampleSlips(today: Date): Slip[] {
	const base = (id: number, fileName: string): Pick<Slip, "id" | "fileName" | "category" | "removed"> => ({
		id: `slip-${id}`,
		fileName,
		category: null,
		removed: false,
	});
	const slipAt = (daysAgo: number, time: string, tail: string, satang: number, id: number): Slip => {
		const when = at(today, daysAgo, time);
		return {
			...base(id, `BBl-Screenshot-000${id}.jpeg`),
			status: "ok",
			satang,
			at: when,
			ref: refFor(when, tail),
		};
	};

	const second = slipAt(1, "13:54", "0023002524", 46100, 2);
	return [
		slipAt(1, "10:32", "0031807368", 4500, 1),
		second,
		slipAt(1, "16:56", "0066603083", 18000, 3),
		{ ...base(4, "BBl-Screenshot-0004.jpeg"), status: "unreadable" },
		slipAt(0, "11:24", "0334122763", 3500, 5),
		{ ...base(6, "BBl-Screenshot-0006.jpeg"), status: "duplicate", satang: second.satang, at: second.at, ref: second.ref, duplicateOf: 2 },
		slipAt(0, "11:51", "0337327089", 2500, 7),
	];
}
