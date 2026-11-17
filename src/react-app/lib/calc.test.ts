import { describe, expect, it } from "vitest";
import { calcSatang, hasOperator, pressCalcKey, showExpr } from "./calc";
import { inputToSatang } from "./money";

describe("pressCalcKey", () => {
	const type = (keys: string) => keys.split("").reduce(pressCalcKey, "");

	it("builds a sum key by key", () => {
		expect(type("120+45.5*2")).toBe("120+45.5*2");
	});

	it("ignores an operator on an empty sum", () => {
		expect(type("+")).toBe("");
		expect(type("*5")).toBe("5");
	});

	it("replaces an operator typed right after another", () => {
		expect(type("12+-*")).toBe("12*");
	});

	it("keeps the digit limits for each number", () => {
		expect(type("123456789+123456789")).toBe("1234567+1234567");
		expect(type("1.234+1..234")).toBe("1.23+1.23");
		expect(type("5+.5")).toBe("5+0.5");
		expect(type("5+05")).toBe("5+5");
	});

	it("removes the last character on back", () => {
		expect(pressCalcKey("12+3", "back")).toBe("12+");
		expect(pressCalcKey("12+", "back")).toBe("12");
		expect(pressCalcKey("", "back")).toBe("");
	});
});

describe("calcSatang", () => {
	it("gives a plain number the same value as inputToSatang", () => {
		for (const input of ["", ".", "0.", "45", "45.5", "12.34", "9999999.99"]) expect(calcSatang(input)).toBe(inputToSatang(input));
	});

	it("multiplies and divides before it adds and subtracts", () => {
		expect(calcSatang("120+45.5*2")).toBe(21100);
		expect(calcSatang("100-20/4")).toBe(9500);
		expect(calcSatang("2*3+4*5")).toBe(2600);
		expect(calcSatang("100/3")).toBe(3333);
	});

	it("ignores one trailing operator", () => {
		expect(calcSatang("12+")).toBe(1200);
		expect(calcSatang("12*")).toBe(1200);
	});

	it("adds 0.1 and 0.2 exactly", () => {
		expect(calcSatang("0.1+0.2")).toBe(30);
	});

	it("gives 0 when the result cannot be an amount", () => {
		expect(calcSatang("5/0")).toBe(0);
		expect(calcSatang("0/0")).toBe(0);
		expect(calcSatang("5-8")).toBe(0);
		expect(calcSatang("9999999*9999999")).toBe(0);
	});
});

describe("showExpr and hasOperator", () => {
	it("shows the proper signs", () => {
		expect(showExpr("1+2-3*4/5")).toBe("1+2−3×4÷5");
	});

	it("tells a sum from a plain amount", () => {
		expect(hasOperator("12.5")).toBe(false);
		expect(hasOperator("12+")).toBe(true);
	});
});
