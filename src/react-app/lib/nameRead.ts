// Pure helpers for reading the receiver's name from a second, tighter look at the slip.

export type Box = { left: number; top: number; width: number; height: number };

// One line of the first full read: where it starts, and each character with its left edge.
// Thai arrives one character at a time, so everything works on characters, not words.
export type OcrLine = { top: number; chars: { text: string; x0: number }[] };

// shortcut: these ratios are measured on Bangkok Bank slips: the logo column ends near 0.38 of the width and the name starts near 0.40.
const NAME_LEFT = 0.385;
const NAME_RIGHT = 0.985;

const joinedLeft = (line: OcrLine, limit: number) =>
	line.chars
		.filter((c) => c.x0 < limit)
		.map((c) => c.text)
		.join("");

// The area under "ไปที่" and above the fee line, without the logo column. null when the label can't be found.
export function findNameBox(lines: OcrLine[], width: number, height: number): Box | null {
	const label = lines.find((l) => joinedLeft(l, 0.2 * width).includes("ไปที่"));
	if (!label) return null;
	const fee = lines.filter((l) => l.top > label.top + 20 && joinedLeft(l, 0.3 * width).includes("ธรรมเนียม")).map((l) => l.top);
	const top = Math.max(0, Math.round(label.top - 0.01 * height));
	const bottom = Math.min(height, fee.length > 0 ? Math.min(...fee) - 4 : Math.round(label.top + 0.11 * height));
	if (bottom - top < 20) return null;
	const left = Math.round(NAME_LEFT * width);
	return { left, top, width: Math.round(NAME_RIGHT * width) - left, height: bottom - top };
}

export type Names = { both: string; thai: string; eng: string };

const letters = (s: string) => s.match(/\p{L}/gu) ?? [];
const thaiShare = (s: string) => {
	const all = letters(s);
	return all.length === 0 ? 0 : all.filter((c) => /\p{Script=Thai}/u.test(c)).length / all.length;
};
const garbled = (s: string) => /\p{Script=Thai}/u.test(s) && /\d/.test(s);

// Three readings of the same name area, one per model. One model for two scripts makes Thai decode as Latin and back,
// so: trust the Thai-only reading when it is clean Thai and the combined one mixes in stray Latin; and when the combined
// reading is Thai mixed with digits (a Latin name misread as Thai), use the English-only one if it looks like a Latin name.
export function pickName({ both, thai, eng }: Names): string {
	const mixed = thaiShare(both) > 0.05 && thaiShare(both) < 0.95;
	if (thai !== "" && thaiShare(thai) >= 0.9 && !/\d/.test(thai) && mixed) return thai;
	if (garbled(both) && /[A-Z]{3}/.test(eng)) return eng;
	return both || thai || eng;
}
