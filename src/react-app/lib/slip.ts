// Reads the fields out of OCR text from a Bangkok Bank transfer slip.
// shortcut: tuned to that one layout (amount under the date, receiver after "ไปที่"); other banks need their own rules.

export type SlipFields = {
	satang: number | null;
	at: Date | null;
	receiver: string;
	// The bank's long transaction number: unique per payment, so it doubles as the duplicate check.
	slipRef: string | null;
	// Identifies the shop or person paid, so a repeat payment can reuse the name and tag you gave last time.
	payeeKey: string | null;
};

const THAI_MONTHS = ["มค", "กพ", "มีค", "เมย", "พค", "มิย", "กค", "สค", "กย", "ตค", "พย", "ธค"];

// Lines that end the receiver block: bank or PromptPay label, account number, biller, service and shop codes, fee.
const RECEIVER_END = /^(biller|service code|รหัส|ค่า|หมายเลข|เลขที่)|ธนาคาร|พร้อมเพย์|[\dx]{3,}-/i;

function satangFrom(text: string): number | null {
	const m = text.match(/(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})(?!\d)/);
	if (!m) return null;
	const satang = Number(m[1].replace(/,/g, "")) * 100 + Number(m[2]);
	return satang > 0 ? satang : null;
}

// The reference starts with the payment time (YYYYMMDDHHMM), which still works when OCR garbles the Thai month.
function timeFromRef(ref: string | null): Date | null {
	const m = ref?.match(/^(20\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
	return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) : null;
}

function timeFromHeader(text: string): Date | null {
	const m = text.match(/(\d{1,2})\s+(\S+?)\s+(\d{2}),?\s+(\d{1,2}):(\d{2})/);
	const month = m ? THAI_MONTHS.indexOf(m[2].replace(/\./g, "")) : -1;
	// Buddhist Era: 69 means 2569, which is 2026.
	return m && month >= 0 ? new Date(2500 + Number(m[3]) - 543, month, Number(m[1]), Number(m[4]), Number(m[5])) : null;
}

// OCR writes the Thai "ำ" as two characters, which would break the word matching.
export const normalizeThai = (raw: string) => raw.replace(/\u0e4d\u0e32/g, "\u0e33");

// The name block: up to four lines, stopping where the bank's codes start.
function nameFromLines(lines: string[]): string {
	const found: string[] = [];
	for (const line of lines.slice(0, 4)) {
		// Drop the label and the stray icon OCR reads at the start of a line: symbols, or a short lowercase "word" like "fn".
		// shortcut: a real name that starts with a 1-2 letter lowercase word would lose it; upper case and digits ("MR", "7 Eleven") are safe.
		const text = line.replace("ไปที่", "").replace(/^[^\p{L}\p{N}(]+/u, "").replace(/^\p{Ll}{1,2}\s+/u, "").trim();
		if (!text) continue;
		if (RECEIVER_END.test(text)) break;
		found.push(text);
	}
	return found.join(" ");
}

function receiverFrom(lines: string[]): string {
	const start = lines.findIndex((l) => l.includes("ไปที่"));
	return start < 0 ? "" : nameFromLines(lines.slice(start));
}

// Text from a crop of just the name area, so there is no label to find.
export const receiverFromCrop = (raw: string) => nameFromLines(normalizeThai(raw).split("\n").map((l) => l.trim()));

// Who was paid, from text after "ไปที่" only, so the sender's own account is never used. OCR reads the x's of a masked
// number as x, X, * or %, so they are made the same.
// A Biller ID alone is NOT enough: one processor's ID is shared by many shops, so a shop is its Biller ID plus the shop
// code printed under "รหัสร้านค้า". A biller with no readable shop code gets no key, so no wrong name is ever filled in.
function payeeKeyFrom(lines: string[]): string | null {
	const start = lines.findIndex((l) => l.includes("ไปที่"));
	if (start < 0) return null;
	const after = lines.slice(start);
	const biller = after.join("\n").match(/\b0\d{14}\b/)?.[0];
	if (biller) {
		const label = after.findIndex((l) => l.includes("รหัสร้านค้า"));
		const shop = after.slice(label + 1).find((l) => l !== "")?.match(/\d{8,}/)?.[0];
		return label >= 0 && shop ? `b:${biller}:${shop}` : null;
	}
	const text = after.join("\n");
	const masked = text.match(/\b\d{3}-[\dxX*%-]*[xX*%][\dxX*%-]*\b/);
	if (masked) return `a:${masked[0].replace(/[X*%]/g, "x")}`;
	const wallet = text.match(/\b\d{5}-\d{3}-\d{3}-\d{4}\b/);
	return wallet ? `w:${wallet[0]}` : null;
}

export function parseSlip(raw: string): SlipFields {
	const text = normalizeThai(raw);
	const lines = text.split("\n").map((l) => l.trim());
	// It must start with a real date (YYYYMMDD): a shop slip also prints a 20-digit shop code, which is not unique per payment.
	const slipRef = text.match(/\b20\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{9,}[A-Z]{0,3}\b/)?.[0] ?? null;
	// The amount is the first money figure above the sender block; later 0.00 is the fee.
	const sender = lines.findIndex((l) => l.includes("จาก"));
	const top = lines.slice(0, sender < 0 ? undefined : sender).join("\n");
	return { satang: satangFrom(top), at: timeFromHeader(text) ?? timeFromRef(slipRef), receiver: receiverFrom(lines), slipRef, payeeKey: payeeKeyFrom(lines) };
}
