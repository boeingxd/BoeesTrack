import { dayKey, timeLabel } from "./dates";
import type { Entry } from "./types";

// Quote a cell only when it needs it: a comma, quote or line break would otherwise break the row.
const cell = (text: string) => (/[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);

const BOM = String.fromCharCode(0xfeff);

// The leading BOM (byte order mark) tells Excel the file is UTF-8, so Thai notes show correctly.
export function entriesToCsv(entries: Entry[]): string {
	const rows = [...entries]
		.sort((a, b) => a.at.getTime() - b.at.getTime())
		.map((e) => [dayKey(e.at), timeLabel(e.at), e.kind, (e.satang / 100).toFixed(2), e.category ?? "", e.note, e.pot ?? ""].map(cell).join(","));
	return `${BOM}${["date,time,kind,amount_baht,category,note,pot", ...rows].join("\r\n")}\r\n`;
}
