import { describe, expect, it } from "vitest";
import { MAX_BATCH, MAX_DELETE, SLIP_REF, entryFromRow, parseCategory, parseEntries, parseBefore, parseIds, parsePlan, parsePot, planFromRow, planToColumns } from "./wire";

const entry = { id: "e1", kind: "spent", satang: 8500, at: 1_760_000_000_000, category: "Food & drink", note: "Iced coffee" };

describe("parseBefore", () => {
	it("takes a whole non-negative number or a numeric string, and nothing else", () => {
		expect(parseBefore(1_760_000_000_000)).toBe(1_760_000_000_000);
		expect(parseBefore("1760000000000")).toBe(1_760_000_000_000);
		for (const bad of [undefined, null, "", " ", "abc", -1, 1.5, "1.5", NaN, {}]) expect(parseBefore(bad)).toBeNull();
	});
});

describe("parseIds", () => {
	it("accepts a list of ids and rejects empty, repeated, blank, oversized and malformed bodies", () => {
		expect(parseIds({ ids: ["a", "b"] })).toEqual({ ok: true, value: ["a", "b"] });
		expect(parseIds({ ids: [] }).ok).toBe(false);
		expect(parseIds({ ids: ["a", "a"] }).ok).toBe(false);
		expect(parseIds({ ids: ["a", " "] }).ok).toBe(false);
		expect(parseIds({ ids: [1] }).ok).toBe(false);
		expect(parseIds({ ids: Array.from({ length: MAX_DELETE + 1 }, (_, i) => `e${i}`) }).ok).toBe(false);
		expect(parseIds(["a"]).ok).toBe(false);
		expect(parseIds(null).ok).toBe(false);
	});
});

describe("parseEntries", () => {
	it("accepts a valid spent entry and keeps optional fields out when absent", () => {
		const r = parseEntries([entry]);
		expect(r).toEqual({ ok: true, value: [entry] });
	});

	it("keeps slipRef and pot when given", () => {
		const r = parseEntries([{ ...entry, slipRef: "ref1", pot: "Laptop" }]);
		expect(r.ok && r.value[0]).toMatchObject({ slipRef: "ref1", pot: "Laptop" });
	});

	it("allows a negative adjust but not a negative spend", () => {
		expect(parseEntries([{ ...entry, kind: "adjust", satang: -500, category: null }]).ok).toBe(true);
		expect(parseEntries([{ ...entry, satang: -500 }]).ok).toBe(false);
	});

	it("rejects zero, float and unsafe amounts and times", () => {
		expect(parseEntries([{ ...entry, satang: 0 }]).ok).toBe(false);
		expect(parseEntries([{ ...entry, satang: 12.5 }]).ok).toBe(false);
		expect(parseEntries([{ ...entry, at: 1.5 }]).ok).toBe(false);
		expect(parseEntries([{ ...entry, at: -1 }]).ok).toBe(false);
	});

	it("rejects an unknown kind and a saved entry without a pot", () => {
		expect(parseEntries([{ ...entry, kind: "gift" }]).ok).toBe(false);
		expect(parseEntries([{ ...entry, kind: "saved", category: null }]).ok).toBe(false);
		expect(parseEntries([{ ...entry, kind: "saved", category: null, pot: "Trip" }]).ok).toBe(true);
	});

	it("rejects a repeated id, an empty list, a non-array and an oversized batch", () => {
		expect(parseEntries([entry, entry]).ok).toBe(false);
		expect(parseEntries([]).ok).toBe(false);
		expect(parseEntries(null).ok).toBe(false);
		expect(parseEntries({}).ok).toBe(false);
		const many = Array.from({ length: MAX_BATCH + 1 }, (_, i) => ({ ...entry, id: `e${i}` }));
		expect(parseEntries(many).ok).toBe(false);
	});

	it("rejects missing or blank text fields", () => {
		expect(parseEntries([{ ...entry, id: "" }]).ok).toBe(false);
		expect(parseEntries([{ ...entry, note: undefined }]).ok).toBe(false);
		expect(parseEntries([{ ...entry, category: "  " }]).ok).toBe(false);
	});
});

describe("parsePot", () => {
	it("accepts a pot with Thai letters and spaces in its name", () => {
		expect(parsePot({ name: "ทริป ญี่ปุ่น", target: 500_000, monthly: 50_000 }).ok).toBe(true);
	});
	it("rejects a blank name and negative or float amounts", () => {
		expect(parsePot({ name: " ", target: 1, monthly: 1 }).ok).toBe(false);
		expect(parsePot({ name: "A", target: -1, monthly: 1 }).ok).toBe(false);
		expect(parsePot({ name: "A", target: 1, monthly: 1.5 }).ok).toBe(false);
	});
});

describe("parsePlan", () => {
	it("accepts auto, off and fixed", () => {
		expect(parsePlan({ monthly: 2_000_000, daily: "auto" }).ok).toBe(true);
		expect(parsePlan({ monthly: 0, daily: "off" }).ok).toBe(true);
		expect(parsePlan({ monthly: 1, daily: { fixed: 30_000 } }).ok).toBe(true);
	});
	it("rejects other daily values and a bad monthly", () => {
		expect(parsePlan({ monthly: 1, daily: "weekly" }).ok).toBe(false);
		expect(parsePlan({ monthly: 1, daily: { fixed: -1 } }).ok).toBe(false);
		expect(parsePlan({ monthly: -1, daily: "auto" }).ok).toBe(false);
	});
});

describe("parseCategory", () => {
	it("returns the trimmed name", () => {
		expect(parseCategory({ name: " Pets " })).toEqual({ ok: true, value: "Pets" });
	});
	it("rejects a blank or missing name", () => {
		expect(parseCategory({ name: "" }).ok).toBe(false);
		expect(parseCategory({}).ok).toBe(false);
	});
});

describe("row mapping", () => {
	it("turns null columns into missing fields", () => {
		const row = { id: "e1", kind: "spent" as const, satang: 100, at: 5, category: null, note: "", slip_ref: null, pot: null, payee_key: null, has_image: 0 };
		expect(entryFromRow(row)).toEqual({ id: "e1", kind: "spent", satang: 100, at: 5, category: null, note: "" });
	});
	it("keeps slip_ref and pot as slipRef and pot", () => {
		const row = { id: "e1", kind: "spent" as const, satang: 100, at: 5, category: "Bills", note: "", slip_ref: "r", pot: "Trip", payee_key: null, has_image: 0 };
		expect(entryFromRow(row)).toMatchObject({ slipRef: "r", pot: "Trip" });
	});
	it("round-trips payeeKey and keeps it out when empty", () => {
		expect(parseEntries([{ ...entry, payeeKey: "b:010000000000001" }])).toMatchObject({ ok: true, value: [{ payeeKey: "b:010000000000001" }] });
		expect(parseEntries([{ ...entry, payeeKey: "" }]).ok).toBe(false);
		const row = { id: "e1", kind: "spent" as const, satang: 100, at: 5, category: null, note: "", slip_ref: null, pot: null, payee_key: "a:094-xxx-6338", has_image: 0 };
		expect(entryFromRow(row)).toMatchObject({ payeeKey: "a:094-xxx-6338" });
	});
	it("shows hasImage only when a picture is stored", () => {
		const row = { id: "e1", kind: "spent" as const, satang: 100, at: 5, category: null, note: "", slip_ref: "r", pot: null, payee_key: null, has_image: 1 };
		expect(entryFromRow(row)).toMatchObject({ hasImage: true });
	});
	it("round-trips the plan through its columns", () => {
		expect(planFromRow({ monthly: 1, daily_mode: "auto", daily_fixed: null })).toEqual({ monthly: 1, daily: "auto" });
		expect(planFromRow({ monthly: 1, daily_mode: "fixed", daily_fixed: 3000 })).toEqual({ monthly: 1, daily: { fixed: 3000 } });
		expect(planToColumns({ monthly: 1, daily: { fixed: 3000 } })).toEqual({ mode: "fixed", fixed: 3000 });
		expect(planToColumns({ monthly: 1, daily: "off" })).toEqual({ mode: "off", fixed: null });
	});
});

describe("slip pictures", () => {
	it("ignores a hasImage sent by the browser", () => {
		const r = parseEntries([{ ...entry, hasImage: true }]);
		expect(r).toEqual({ ok: true, value: [entry] });
	});
	it("only allows plain letters and digits as a bucket key", () => {
		expect(SLIP_REF.test("2030010309150012345678AD")).toBe(true);
		expect(SLIP_REF.test("../secret")).toBe(false);
		expect(SLIP_REF.test("a/b0123456789")).toBe(false);
		expect(SLIP_REF.test("short")).toBe(false);
	});
});
