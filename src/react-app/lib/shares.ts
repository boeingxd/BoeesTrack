import type { Entry, Share } from "./types";

// Friends owe me: you pay a whole bill, friends owe their parts. Only your own part is spending.
// A payback is a "received" entry pointing at the share it settles; it raises the balance but is not income.
// A forgiven share becomes your spending on the day you forgive it.

const sumOf = (shares: Share[]) => shares.reduce((sum, p) => sum + p.satang, 0);

// What you paid for yourself on a bill: the total less every friend's part.
export const ownPart = (entry: Entry) => entry.satang - sumOf(entry.shares ?? []);

// Every share id still on a bill, so a payback for a deleted bill counts as ordinary money in.
const liveShareIds = (entries: Entry[]) => new Set(entries.flatMap((e) => (e.shares ?? []).map((p) => p.id)));

export function isPayback(entry: Entry, live: Set<string>): boolean {
	return entry.kind === "received" && entry.share !== undefined && live.has(entry.share);
}

// A forgiven share as a line of its own on the day it was forgiven, in the bill's tag. It is not a saved transaction:
// its id is `<bill id>#<share id>`, so a tap on it opens the bill (see billId) and it can't be deleted on its own.
export function forgivenItems(entries: Entry[]): Entry[] {
	return entries.flatMap((e) =>
		e.kind === "spent"
			? (e.shares ?? []).flatMap((p) =>
					p.forgivenAt ? [{ ...e, id: `${e.id}#${p.id}`, satang: p.satang, at: p.forgivenAt, note: `Forgiven · ${p.friend}`, shares: undefined, slipRef: undefined, hasImage: undefined }] : [],
				)
			: [],
	);
}

export const isForgivenItem = (entry: Entry) => entry.id.includes("#");
export const billId = (id: string) => id.split("#")[0];

// The day pages: every transaction plus the forgiven lines, so each day's total matches what it lists.
export const withForgiven = (entries: Entry[]) => [...entries, ...forgivenItems(entries)];

// Your spending, one item per bill (your part only) plus one per forgiven share on its own day.
export function ownSpending(entries: Entry[]): Entry[] {
	const out: Entry[] = [];
	for (const e of entries) {
		if (e.kind !== "spent" || isForgivenItem(e)) continue;
		const own = ownPart(e);
		if (own > 0) out.push(e.shares?.length ? { ...e, satang: own } : e);
	}
	return [...out, ...forgivenItems(entries)];
}

// Money that came in, without paybacks from friends.
export function income(entries: Entry[]): Entry[] {
	const live = liveShareIds(entries);
	return entries.filter((e) => e.kind === "received" && !isPayback(e, live));
}

export type ShareState = { kind: "open" } | { kind: "paid"; payback: Entry } | { kind: "forgiven"; at: Date };

export function shareState(share: Share, entries: Entry[]): ShareState {
	if (share.forgivenAt) return { kind: "forgiven", at: share.forgivenAt };
	const payback = entries.find((e) => e.kind === "received" && e.share === share.id);
	return payback ? { kind: "paid", payback } : { kind: "open" };
}

export type OpenShare = { bill: Entry; share: Share };
export type FriendOwes = { friend: string; satang: number; open: OpenShare[] };

// Who still owes you, biggest first. Names match whatever the case or spaces; the newest spelling is shown.
export function owedByFriend(entries: Entry[]): FriendOwes[] {
	const paid = new Set(entries.flatMap((e) => (e.kind === "received" && e.share ? [e.share] : [])));
	const groups = new Map<string, FriendOwes>();
	const bills = entries.filter((e) => e.kind === "spent" && e.shares?.length).sort((a, b) => a.at.getTime() - b.at.getTime());
	for (const bill of bills) {
		for (const share of bill.shares ?? []) {
			if (share.forgivenAt || paid.has(share.id)) continue;
			const key = friendKey(share.friend);
			const group = groups.get(key) ?? { friend: share.friend, satang: 0, open: [] };
			group.friend = share.friend;
			group.satang += share.satang;
			group.open.push({ bill, share });
			groups.set(key, group);
		}
	}
	return [...groups.values()].sort((a, b) => b.satang - a.satang || a.friend.localeCompare(b.friend));
}

const friendKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

// Friends you have split with before, most recent first, for suggestions while typing.
export function friendNames(entries: Entry[]): string[] {
	const seen = new Map<string, { name: string; at: number }>();
	for (const e of entries) {
		for (const p of e.shares ?? []) {
			const key = friendKey(p.friend);
			const prev = seen.get(key);
			if (!prev || prev.at <= e.at.getTime()) seen.set(key, { name: p.friend, at: e.at.getTime() });
		}
	}
	return [...seen.values()].sort((a, b) => b.at - a.at).map((s) => s.name);
}

// An even split between you and `friends` people. Friends' parts are rounded down to whole baht when the bill
// allows it (nobody transfers ฿33.33); whatever is left over stays with you.
export function splitEvenly(total: number, friends: number): number {
	if (friends <= 0) return 0;
	const exact = Math.floor(total / (friends + 1));
	return exact >= 100 ? Math.floor(exact / 100) * 100 : exact;
}

export function payback(share: Share, at: Date): Entry {
	return { id: `payback-${at.getTime()}`, kind: "received", satang: share.satang, at, category: null, note: share.friend, share: share.id };
}

export function forgive(bill: Entry, shareId: string, at: Date): Entry {
	return { ...bill, shares: bill.shares?.map((p) => (p.id === shareId ? { ...p, forgivenAt: at } : p)) };
}

// The bill a payback settles, if it is still there.
export const billFor = (entry: Entry, entries: Entry[]): OpenShare | null => {
	if (!entry.share) return null;
	for (const bill of entries) {
		const share = bill.shares?.find((p) => p.id === entry.share);
		if (share) return { bill, share };
	}
	return null;
};
