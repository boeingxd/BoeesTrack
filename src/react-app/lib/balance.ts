import { sameMonth } from "./dates";
import type { Entry, Pot } from "./types";

// Money you hold: received and adjustments add, spending and setting aside take away.
// Spending paid from a pot comes out of the pot instead, so the balance does not move.
export function balance(entries: Entry[]): number {
	return entries.reduce((sum, e) => {
		if (e.kind === "received" || e.kind === "adjust") return sum + e.satang;
		if (e.kind === "saved") return sum - e.satang;
		return e.pot ? sum : sum - e.satang;
	}, 0);
}

export type PotTotal = { pot: Pot; total: number; thisMonth: number };

export function potTotals(entries: Entry[], pots: Pot[], today: Date): PotTotal[] {
	return pots.map((pot) => {
		const mine = entries.filter((e) => e.pot === pot.name);
		const saved = mine.filter((e) => e.kind === "saved");
		const out = mine.filter((e) => e.kind === "spent").reduce((s, e) => s + e.satang, 0);
		return {
			pot,
			total: saved.reduce((s, e) => s + e.satang, 0) - out,
			thisMonth: saved.filter((e) => sameMonth(e.at, today)).reduce((s, e) => s + e.satang, 0),
		};
	});
}

// Compares the app with the real bank balance; the gap becomes a dated adjustment, or null when they match.
// The very first check-in against an empty list is how a starting balance is entered.
export function checkIn(entries: Entry[], bankSatang: number, at: Date): Entry | null {
	const gap = bankSatang - balance(entries);
	if (gap === 0) return null;
	return { id: `adjust-${at.getTime()}`, kind: "adjust", satang: gap, at, category: null, note: "Checked against bank" };
}
