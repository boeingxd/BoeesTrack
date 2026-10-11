import { describe, expect, it } from "vitest";
import { balance, checkIn, potTotals } from "./balance";
import type { Entry, Pot } from "./types";

const baht = (n: number) => n * 100;
const today = new Date(2026, 9, 8, 14, 0);

function entry(kind: Entry["kind"], amount: number, extra: Partial<Entry> = {}): Entry {
	return { id: `${kind}-${amount}-${Math.random()}`, kind, satang: baht(amount), at: new Date(2026, 9, 5, 12, 0), category: null, note: "", ...extra };
}

const pots: Pot[] = [{ name: "Trip", target: baht(5_000), monthly: baht(500) }];

describe("balance", () => {
	it("adds received money and takes off spending and savings", () => {
		expect(balance([entry("received", 1_000), entry("spent", 200), entry("saved", 300, { pot: "Trip" })])).toBe(baht(500));
	});

	it("leaves the balance alone when spending is paid from a pot", () => {
		expect(balance([entry("received", 1_000), entry("spent", 200, { pot: "Trip" })])).toBe(baht(1_000));
	});

	it("applies adjustments in either direction", () => {
		expect(balance([entry("adjust", 800), entry("adjust", -150)])).toBe(baht(650));
	});
});

describe("potTotals", () => {
	it("totals what went in minus what came out, and what went in this month", () => {
		const old = entry("saved", 400, { pot: "Trip", at: new Date(2026, 8, 20, 12, 0) });
		const [trip] = potTotals([old, entry("saved", 300, { pot: "Trip" }), entry("spent", 200, { pot: "Trip" })], pots, today);
		expect(trip.total).toBe(baht(500));
		expect(trip.thisMonth).toBe(baht(300));
	});

	it("can go negative when more is spent than the pot holds", () => {
		const [trip] = potTotals([entry("spent", 100, { pot: "Trip" })], pots, today);
		expect(trip.total).toBe(-baht(100));
	});
});

describe("checkIn", () => {
	it("enters a starting balance when nothing exists yet", () => {
		expect(checkIn([], baht(8_000), today)?.satang).toBe(baht(8_000));
	});

	it("records the gap between the app and the bank", () => {
		const list = [entry("adjust", 8_000), entry("spent", 2_800)]; // app says 5,200
		expect(checkIn(list, baht(5_050), today)?.satang).toBe(-baht(150));
	});

	it("returns nothing when they already match", () => {
		expect(checkIn([entry("adjust", 100)], baht(100), today)).toBeNull();
	});
});
