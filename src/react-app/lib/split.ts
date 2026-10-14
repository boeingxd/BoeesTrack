import { inputToSatang } from "./money";
import { splitEvenly } from "./shares";
import type { Share } from "./types";

// One friend's line while splitting. `settled` is set for a part already paid back or forgiven: it is shown, not edited.
export type SplitRow = { id: string; friend: string; input: string; forgivenAt?: Date; settled?: string };
// `even` keeps every open part equal and follows the total as it is typed, until a part is typed by hand.
export type Split = { rows: SplitRow[]; even: boolean };

export const clean = (text: string) => text.replace(/[^\d.]/g, "");
export const toText = (satang: number) => (satang > 0 ? String(satang / 100) : "");
export const newShareId = () => `share-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function startSplit(shares: Share[] | undefined, settled: Map<string, string>): Split {
	return {
		rows: (shares ?? []).map((p) => ({ id: p.id, friend: p.friend, input: toText(p.satang), forgivenAt: p.forgivenAt, settled: settled.get(p.id) })),
		even: false,
	};
}

// What each line comes to now: an even part of the total, or what was typed.
export function partOf(split: Split, row: SplitRow, total: number): number {
	if (split.even && !row.settled) return splitEvenly(total, split.rows.length);
	return inputToSatang(clean(row.input));
}

// Empty lines are ignored; a line with only a name or only an amount is unfinished and holds the save back.
export function splitResult(split: Split, total: number): { shares: Share[]; unfinished: boolean; own: number } {
	const shares: Share[] = [];
	let unfinished = false;
	// Your share counts every part on screen, named or not, so it matches the numbers shown.
	let own = total;
	for (const row of split.rows) {
		const satang = partOf(split, row, total);
		const friend = row.friend.trim();
		own -= satang;
		if (friend === "" && satang === 0) continue;
		if (friend === "" || satang === 0) unfinished = true;
		else shares.push({ id: row.id, friend, satang, ...(row.forgivenAt ? { forgivenAt: row.forgivenAt } : {}) });
	}
	return { shares, unfinished, own };
}
