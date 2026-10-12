import { describe, expect, it } from "vitest";
import { fillPercent } from "./meter";

describe("fillPercent", () => {
	it("is the share of max, in percent", () => {
		expect(fillPercent(25, 100)).toBe(25);
		expect(fillPercent(18_500, 100_000)).toBe(18.5);
	});

	it("is empty for nothing spent", () => {
		expect(fillPercent(0, 100)).toBe(0);
	});

	it("never goes past full, however far over", () => {
		expect(fillPercent(150, 100)).toBe(100);
	});

	it("keeps a small non-zero amount visible with a 2% floor", () => {
		expect(fillPercent(1, 1000)).toBe(2);
	});

	it("treats a negative value as empty", () => {
		expect(fillPercent(-500, 100)).toBe(0);
	});

	it("is full when something is spent against a zero or negative max", () => {
		expect(fillPercent(100, 0)).toBe(100);
		expect(fillPercent(100, -5)).toBe(100);
	});

	it("is empty when nothing is spent against a zero max", () => {
		expect(fillPercent(0, 0)).toBe(0);
	});
});
