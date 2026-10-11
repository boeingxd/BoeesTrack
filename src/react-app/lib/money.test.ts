import { describe, expect, it } from "vitest";
import { formatBaht, groupInput, inputToSatang, pressKey } from "./money";

describe("formatBaht", () => {
	it("drops the decimals for whole baht and keeps them otherwise", () => {
		expect(formatBaht(4500)).toBe("฿45");
		expect(formatBaht(46150)).toBe("฿461.50");
		expect(formatBaht(1_243_000)).toBe("฿12,430");
	});

	it("shows a proper minus sign for negatives", () => {
		expect(formatBaht(-12000)).toBe("−฿120");
	});
});

describe("pressKey", () => {
	const type = (keys: string[]) => keys.reduce(pressKey, "");

	it("builds an amount digit by digit", () => {
		expect(type(["4", "5"])).toBe("45");
		expect(type(["4", "5", ".", "5"])).toBe("45.5");
	});

	it("allows only one dot and two decimals", () => {
		expect(type(["1", ".", ".", "2", "3", "4"])).toBe("1.23");
	});

	it("starts a bare dot as 0. and replaces a lone leading zero", () => {
		expect(type(["."])).toBe("0.");
		expect(type(["0", "5"])).toBe("5");
	});

	it("backspaces and caps the whole part at 7 digits", () => {
		expect(pressKey("12", "back")).toBe("1");
		expect(pressKey("", "back")).toBe("");
		expect(type(["1", "2", "3", "4", "5", "6", "7", "8"])).toBe("1234567");
	});
});

describe("inputToSatang", () => {
	it("converts typed text to whole satang without float drift", () => {
		expect(inputToSatang("")).toBe(0);
		expect(inputToSatang("0.29")).toBe(29);
		expect(inputToSatang("461")).toBe(46100);
		expect(inputToSatang("12.5")).toBe(1250);
	});
});

describe("groupInput", () => {
	it("groups the whole part and keeps what was typed after the dot", () => {
		expect(groupInput("")).toBe("0");
		expect(groupInput("1234.5")).toBe("1,234.5");
		expect(groupInput("12.")).toBe("12.");
	});
});
