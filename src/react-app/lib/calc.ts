import { inputToSatang, pressKey } from "./money";

const OPS = ["+", "-", "*", "/"];
const MAX_SATANG = 999_999_999;

// The sum stays as plain text ("120+45.5*2"), like the single amount does, so each key press is one small edit.
export function pressCalcKey(current: string, key: string): string {
	if (key === "back") return current.slice(0, -1);
	if (OPS.includes(key)) {
		if (current === "") return current;
		return OPS.includes(current.slice(-1)) ? current.slice(0, -1) + key : current + key;
	}
	// Digits and the dot follow the single-amount rules, applied to the number being typed.
	const start = Math.max(...OPS.map((op) => current.lastIndexOf(op))) + 1;
	return current.slice(0, start) + pressKey(current.slice(start), key);
}

// Works in satang so "0.1+0.2" is exactly 30. Returns 0 for a result that cannot be an amount.
export function calcSatang(expr: string): number {
	const parts = expr.replace(/[+\-*/]$/, "").split(/([+\-*/])/);
	let sum = 0;
	let sign = 1;
	let term = inputToSatang(parts[0]);
	for (let i = 1; i < parts.length; i += 2) {
		const op = parts[i];
		const next = inputToSatang(parts[i + 1]);
		if (op === "*") term = (term * next) / 100;
		else if (op === "/") term = (term / next) * 100;
		else {
			// + or − closes the running term, so × and ÷ are done first.
			sum += sign * term;
			sign = op === "+" ? 1 : -1;
			term = next;
		}
	}
	const total = Math.round(sum + sign * term);
	return total > 0 && total <= MAX_SATANG ? total : 0;
}

export const showExpr = (expr: string) => expr.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−");

export const hasOperator = (expr: string) => /[+\-*/]/.test(expr);
