export function bahtParts(satang: number) {
	const abs = Math.abs(satang);
	const whole = abs % 100 === 0;
	const digits = (abs / 100).toLocaleString("en-US", {
		minimumFractionDigits: whole ? 0 : 2,
		maximumFractionDigits: 2,
	});
	return { sign: satang < 0 ? "−" : "", digits };
}

export function formatBaht(satang: number): string {
	const { sign, digits } = bahtParts(satang);
	return `${sign}฿${digits}`;
}

// Keypad input stays as text ("12.5") so the dot and trailing zeros behave like a calculator.
export function pressKey(current: string, key: string): string {
	if (key === "back") return current.slice(0, -1);
	if (key === ".") {
		if (current.includes(".")) return current;
		return current === "" ? "0." : `${current}.`;
	}
	const [whole, decimals] = current.split(".");
	if (decimals !== undefined && decimals.length >= 2) return current;
	if (decimals === undefined && whole.length >= 7) return current;
	if (current === "0") return key;
	return current + key;
}

export function inputToSatang(input: string): number {
	if (input === "" || input === ".") return 0;
	return Math.round(Number(input) * 100);
}

// Groups the whole part ("1234.5" becomes "1,234.5") without touching what was typed after the dot.
export function groupInput(input: string): string {
	if (input === "") return "0";
	const [whole, decimals] = input.split(".");
	const grouped = Number(whole).toLocaleString("en-US");
	return decimals === undefined ? grouped : `${grouped}.${decimals}`;
}
