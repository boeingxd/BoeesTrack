import { describe, expect, it } from "vitest";
import { fromWire, toWire } from "./api";
import type { Entry } from "./types";

describe("entry wire conversion", () => {
	it("round-trips an entry through milliseconds", () => {
		const e: Entry = { id: "e1", kind: "saved", satang: 100_000, at: new Date(2026, 9, 12, 21, 0), category: null, note: "Monthly goal", pot: "Laptop" };
		expect(fromWire(toWire(e))).toEqual(e);
	});

	it("leaves slipRef and pot out when the entry has none", () => {
		const e: Entry = { id: "e2", kind: "spent", satang: 4400, at: new Date(2026, 9, 12), category: "Transport", note: "BTS" };
		const wire = toWire(e);
		expect(wire.at).toBe(e.at.getTime());
		expect("slipRef" in wire).toBe(false);
		expect("pot" in wire).toBe(false);
	});
});
