import { describe, expect, it } from "vitest";
import { entriesToCsv } from "./csv";
import type { Entry } from "./types";

const entry = (over: Partial<Entry>): Entry => ({ id: "a", kind: "spent", satang: 4500, at: new Date(2026, 9, 12, 8, 5), category: "Food", note: "", ...over });

describe("entriesToCsv", () => {
	it("starts with a BOM and the header, and writes baht with two decimals", () => {
		const csv = entriesToCsv([entry({ note: "coffee" })]);
		expect(csv.startsWith("﻿date,time,kind,amount_baht,category,note,pot\r\n")).toBe(true);
		expect(csv).toContain("2026-10-12,08:05,spent,45.00,Food,coffee,\r\n");
	});

	it("quotes notes with commas, quotes and line breaks, and keeps Thai text", () => {
		const csv = entriesToCsv([entry({ note: 'a,"b"\nกาแฟ', category: null })]);
		expect(csv).toContain(',,"a,""b""\nกาแฟ",');
	});

	it("sorts oldest first and includes the pot", () => {
		const csv = entriesToCsv([entry({ id: "new", at: new Date(2026, 9, 12) }), entry({ id: "old", at: new Date(2026, 9, 1), kind: "saved", pot: "Trip" })]);
		const lines = csv.trim().split("\r\n");
		expect(lines[1]).toContain("2026-10-01");
		expect(lines[1].endsWith(",Trip")).toBe(true);
	});
});
