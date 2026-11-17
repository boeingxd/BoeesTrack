import { describe, expect, it } from "vitest";
import { entriesToCsv } from "./csv";
import type { Entry } from "./types";

const entry = (over: Partial<Entry>): Entry => ({ id: "a", kind: "spent", satang: 4500, at: new Date(2026, 9, 12, 8, 5), category: "Food", note: "", ...over });

describe("entriesToCsv", () => {
	it("starts with a BOM and the header, and writes baht with two decimals", () => {
		const csv = entriesToCsv([entry({ note: "coffee" })]);
		expect(csv.startsWith("﻿date,time,kind,amount_baht,category,note,pot,own_baht\r\n")).toBe(true);
		expect(csv).toContain("2026-10-12,08:05,spent,45.00,Food,coffee,,45.00\r\n");
	});

	it("quotes notes with commas, quotes and line breaks, and keeps Thai text", () => {
		const csv = entriesToCsv([entry({ note: 'a,"b"\nกาแฟ', category: null })]);
		expect(csv).toContain(',,"a,""b""\nกาแฟ",');
	});

	it("sorts oldest first and includes the pot", () => {
		const csv = entriesToCsv([entry({ id: "new", at: new Date(2026, 9, 12) }), entry({ id: "old", at: new Date(2026, 9, 1), kind: "saved", pot: "Trip" })]);
		const lines = csv.trim().split("\r\n");
		expect(lines[1]).toContain("2026-10-01");
		expect(lines[1].endsWith(",Trip,45.00")).toBe(true);
	});

	it("counts only your part of a split bill, and a payback as no income", () => {
		const bill = entry({ id: "bill", satang: 30000, shares: [{ id: "s1", friend: "A", satang: 10000 }, { id: "s2", friend: "B", satang: 10000, forgivenAt: new Date(2026, 9, 13) }] });
		const back = entry({ id: "back", kind: "received", satang: 10000, category: null, note: "A", share: "s1", at: new Date(2026, 9, 14, 9, 0) });
		const lines = entriesToCsv([bill, back]).trim().split("\r\n");
		expect(lines[1]).toBe("2026-10-12,08:05,spent,300.00,Food,,,200.00");
		expect(lines[2]).toBe("2026-10-14,09:00,payback,100.00,,A,,0.00");
	});

	it("stops a note that starts like a formula from running in a spreadsheet", () => {
		expect(entriesToCsv([entry({ note: "=1+1" })])).toContain(",Food,'=1+1,");
	});
});
