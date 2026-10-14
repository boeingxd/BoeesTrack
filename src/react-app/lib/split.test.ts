import { describe, expect, it } from "vitest";
import { partOf, splitResult, startSplit, type Split } from "./split";

const baht = (n: number) => n * 100;

describe("splitting a bill", () => {
	it("keeps open parts even and follows the total, leaving the rest as your share", () => {
		const split: Split = {
			even: true,
			rows: [
				{ id: "a", friend: "Ploy", input: "" },
				{ id: "b", friend: "Mint", input: "" },
			],
		};
		expect(splitResult(split, baht(600))).toEqual({
			shares: [
				{ id: "a", friend: "Ploy", satang: baht(200) },
				{ id: "b", friend: "Mint", satang: baht(200) },
			],
			unfinished: false,
			own: baht(200),
		});
		expect(splitResult(split, baht(100)).own).toBe(baht(34));
	});

	it("uses typed parts once even is off, ignores empty lines and holds back half-filled ones", () => {
		const split: Split = {
			even: false,
			rows: [
				{ id: "a", friend: " Ploy ", input: "250.5" },
				{ id: "b", friend: "", input: "" },
			],
		};
		expect(splitResult(split, baht(600))).toEqual({ shares: [{ id: "a", friend: "Ploy", satang: 25050 }], unfinished: false, own: 34950 });
		expect(splitResult({ ...split, rows: [...split.rows, { id: "c", friend: "Mint", input: "" }] }, baht(600)).unfinished).toBe(true);
		expect(splitResult({ ...split, rows: [{ id: "a", friend: "Ploy", input: "700" }] }, baht(600)).own).toBe(baht(-100));
	});

	it("starts an edit from the saved parts, keeping settled parts fixed and forgiven dates", () => {
		const forgivenAt = new Date(2026, 9, 18);
		const split = startSplit(
			[
				{ id: "a", friend: "Ploy", satang: baht(200) },
				{ id: "b", friend: "Mint", satang: baht(150), forgivenAt },
			],
			new Map([["b", "forgiven"]]),
		);
		expect(split.even).toBe(false);
		expect(partOf({ ...split, even: true }, split.rows[1], baht(900))).toBe(baht(150));
		expect(splitResult(split, baht(600)).shares[1]).toEqual({ id: "b", friend: "Mint", satang: baht(150), forgivenAt });
	});
});
