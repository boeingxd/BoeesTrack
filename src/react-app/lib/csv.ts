import { dayKey, timeLabel } from "./dates";
import { ownPart } from "./shares";
import type { Entry } from "./types";

// Quote a cell only when it needs it: a comma, quote or line break would otherwise break the row.
const cell = (text: string) => (/[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
// A spreadsheet runs a cell that starts with = + - or @ as a formula; a leading ' makes it plain text.
const text = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);
const baht = (satang: number) => (satang / 100).toFixed(2);

const BOM = String.fromCharCode(0xfeff);

// What a row adds to your own money: a split bill counts your part plus any part you forgave, and a friend's payback counts nothing.
function own(e: Entry): number {
	if (e.share) return 0;
	if (e.kind !== "spent") return e.satang;
	return ownPart(e) + (e.shares ?? []).reduce((sum, p) => sum + (p.forgivenAt ? p.satang : 0), 0);
}

// The leading BOM (byte order mark) tells Excel the file is UTF-8, so Thai notes show correctly.
// amount_baht is what the bank moved; own_baht is what the app counts, so summing it by kind matches Insight.
export function entriesToCsv(entries: Entry[]): string {
	const rows = [...entries]
		.sort((a, b) => a.at.getTime() - b.at.getTime())
		.map((e) =>
			[dayKey(e.at), timeLabel(e.at), e.share ? "payback" : e.kind, baht(e.satang), text(e.category ?? ""), text(e.note), text(e.pot ?? ""), baht(own(e))].map(cell).join(","),
		);
	return `${BOM}${["date,time,kind,amount_baht,category,note,pot,own_baht", ...rows].join("\r\n")}\r\n`;
}
