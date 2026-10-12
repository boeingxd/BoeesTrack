import { describe, expect, it } from "vitest";
import { formatSize } from "./size";

describe("formatSize", () => {
	it("shows KB under a megabyte and MB with one decimal above", () => {
		expect(formatSize(0)).toBe("0 KB");
		expect(formatSize(450_000)).toBe("450 KB");
		expect(formatSize(2_340_000)).toBe("2.3 MB");
	});
});
