import { describe, expect, it } from "vitest";
import { fromWire, toWire } from "./api";
import { standing } from "./allowance";
import { balance } from "./balance";
import { flows, periodRange } from "./stats";
import { billFor, forgive, friendNames, income, ownSpending, owedByFriend, payback, shareState, splitEvenly } from "./shares";
import type { Entry } from "./types";

const baht = (n: number) => n * 100;
const today = new Date(2026, 9, 20, 18, 0);
const month = periodRange("month", today);

// A ฿600 dinner on the 10th, two friends owing ฿200 each.
const dinner: Entry = {
	id: "dinner",
	kind: "spent",
	satang: baht(600),
	at: new Date(2026, 9, 10, 19, 0),
	category: "Hangouts",
	note: "Shabu",
	shares: [
		{ id: "s-ploy", friend: "Ploy", satang: baht(200) },
		{ id: "s-mint", friend: "Mint", satang: baht(200) },
	],
};
const allowance: Entry = { id: "in", kind: "received", satang: baht(5000), at: new Date(2026, 9, 1), category: null, note: "" };

const total = (list: Entry[]) => list.reduce((sum, e) => sum + e.satang, 0);

describe("friends owe me", () => {
	it("counts only your own part as spending, while the balance drops by the whole bill", () => {
		expect(total(ownSpending([dinner]))).toBe(baht(200));
		expect(flows([allowance, dinner], month).spent).toBe(baht(200));
		expect(standing([dinner], { monthly: baht(3000), daily: "auto" }, today).monthSpent).toBe(baht(200));
		expect(balance([allowance, dinner])).toBe(baht(4400));
	});

	it("a payback settles the share and raises the balance, but is not income", () => {
		const back = payback(dinner.shares![0], new Date(2026, 9, 12));
		const all = [allowance, dinner, back];
		expect(balance(all)).toBe(baht(4600));
		expect(flows(all, month).received).toBe(baht(5000));
		expect(flows(all, month).spent).toBe(baht(200));
		expect(shareState(dinner.shares![0], all)).toEqual({ kind: "paid", payback: back });
		expect(owedByFriend(all).map((f) => [f.friend, f.satang])).toEqual([["Mint", baht(200)]]);
		expect(billFor(back, all)?.bill.id).toBe("dinner");
	});

	it("a forgiven share becomes your spending on the day it is forgiven, in the bill's tag", () => {
		const forgivenOn = new Date(2026, 9, 18, 9, 0);
		const bill = forgive(dinner, "s-mint", forgivenOn);
		const items = ownSpending([bill]);
		expect(items.map((e) => [e.id, e.satang, e.at, e.category])).toEqual([
			["dinner", baht(200), dinner.at, "Hangouts"],
			["dinner#s-mint", baht(200), forgivenOn, "Hangouts"],
		]);
		expect(owedByFriend([bill]).map((f) => f.friend)).toEqual(["Ploy"]);
		expect(shareState(bill.shares![1], [bill])).toEqual({ kind: "forgiven", at: forgivenOn });
	});

	it("leaves out a bill you paid entirely for friends, and counts a deleted bill's payback as income", () => {
		const treat: Entry = { ...dinner, shares: [{ id: "s-all", friend: "Ploy", satang: baht(600) }] };
		expect(ownSpending([treat])).toEqual([]);
		const orphan = payback(dinner.shares![0], today);
		expect(total(income([orphan]))).toBe(baht(200));
	});

	it("groups friends whatever the case or spacing, biggest first", () => {
		const lunch: Entry = { ...dinner, id: "lunch", at: new Date(2026, 9, 15), shares: [{ id: "s-ploy2", friend: " ploy", satang: baht(150) }] };
		const owed = owedByFriend([dinner, lunch]);
		expect(owed.map((f) => [f.friend, f.satang, f.open.length])).toEqual([
			[" ploy", baht(350), 2],
			["Mint", baht(200), 1],
		]);
		expect(friendNames([dinner, lunch])).toEqual([" ploy", "Mint"]);
	});

	it("splits evenly in whole baht and keeps the leftover", () => {
		expect(splitEvenly(baht(600), 2)).toBe(baht(200));
		expect(splitEvenly(baht(100), 2)).toBe(baht(33));
		expect(splitEvenly(250, 2)).toBe(83);
		expect(splitEvenly(baht(600), 0)).toBe(0);
	});

	it("travels to the Worker and back with forgiven dates intact", () => {
		const bill = forgive(dinner, "s-mint", new Date(2026, 9, 18));
		expect(fromWire(toWire(bill))).toEqual(bill);
		const back = payback(dinner.shares![0], today);
		expect(fromWire(toWire(back))).toEqual(back);
	});
});
