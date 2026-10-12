import { describe, expect, it } from "vitest";
import { fingerprint, flagDuplicates, isReady, newSlip, rememberPayee } from "./slipBatch";
import type { Entry, Slip } from "./types";

const slip = (over: Partial<Slip>): Slip => ({ id: "s", fileName: "a.jpeg", status: "ok", note: "", category: null, removed: false, ...over });
const file = (type: string, size = 10) => new File([new Uint8Array(size)], "a", { type });

describe("flagDuplicates", () => {
	it("keeps the first slip and flags a later one with the same reference", () => {
		const out = flagDuplicates([slip({ id: "1", ref: "A" }), slip({ id: "2", ref: "B" }), slip({ id: "3", ref: "A" })], new Set());
		expect(out.map((s) => s.status)).toEqual(["ok", "ok", "duplicate"]);
		expect(out[2].duplicateOf).toBe(1);
	});

	it("flags a slip whose reference is already saved, with no batch position", () => {
		const [out] = flagDuplicates([slip({ ref: "A" })], new Set(["A"]));
		expect(out.status).toBe("duplicate");
		expect(out.duplicateOf).toBeUndefined();
	});

	it("lets the second through again when the first is removed", () => {
		const out = flagDuplicates([slip({ id: "1", ref: "A", removed: true }), slip({ id: "2", ref: "A", status: "duplicate", duplicateOf: 1 })], new Set());
		expect(out[1].status).toBe("ok");
	});

	it("leaves slips that are still reading or unreadable alone", () => {
		const input = [slip({ status: "reading" }), slip({ status: "unreadable", ref: "A" })];
		expect(flagDuplicates(input, new Set(["A"]))).toEqual(input);
	});
});

describe("newSlip and isReady", () => {
	it("refuses a type the server would refuse, and a picture that is too big", () => {
		expect(newSlip(file("application/pdf"), "a").status).toBe("unreadable");
		expect(newSlip(file("image/png", 7 * 1024 * 1024), "a").reason).toMatch(/6 MB/);
	});

	it("needs an amount, a time and a reference before a slip can be added", () => {
		const full = slip({ satang: 4500, at: new Date(), ref: "A" });
		expect(isReady(full)).toBe(true);
		expect(isReady({ ...full, satang: undefined })).toBe(false);
		expect(isReady({ ...full, at: undefined })).toBe(false);
		expect(isReady({ ...full, removed: true })).toBe(false);
	});
});

describe("rememberPayee", () => {
	const past = (over: Partial<Entry>): Entry => ({ id: "e", kind: "spent", satang: 100, at: new Date(2026, 9, 1), category: "Food & drink", note: "TEST SHOP", payeeKey: "b:010000000000001", ...over });

	it("fills in the newest earlier note and tag for the same shop", () => {
		const old = past({ id: "old", note: "OLD NAME", category: "Other" });
		const out = rememberPayee(slip({ payeeKey: "b:010000000000001", note: "garbled" }), [old, past({ at: new Date(2026, 9, 5) })]);
		expect(out).toMatchObject({ note: "TEST SHOP", autoNote: "TEST SHOP", category: "Food & drink", remembered: true });
	});

	it("leaves a slip alone when the shop is new or has no key", () => {
		const s = slip({ payeeKey: "b:999", note: "mine" });
		expect(rememberPayee(s, [past({})])).toBe(s);
		expect(rememberPayee(slip({ note: "x" }), [past({})]).remembered).toBeUndefined();
	});
});

describe("fingerprint", () => {
	it("gives the same code for the same picture and fits the Worker's reference rule", async () => {
		const a = await fingerprint(new Blob([new Uint8Array([1, 2, 3])]));
		expect(a).toBe(await fingerprint(new Blob([new Uint8Array([1, 2, 3])])));
		expect(a).not.toBe(await fingerprint(new Blob([new Uint8Array([1, 2, 4])])));
		expect(a).toMatch(/^[A-Za-z0-9]{10,60}$/);
	});
});
