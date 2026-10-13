import { describe, expect, it } from "vitest";
import { otherLast } from "./categories";

describe("otherLast", () => {
	it("moves Other to the end and keeps the rest in order", () => {
		expect(otherLast(["Food", "Other", "Bills", "Gym"])).toEqual(["Food", "Bills", "Gym", "Other"]);
	});

	it("leaves a list without Other alone", () => {
		expect(otherLast(["Food", "Bills"])).toEqual(["Food", "Bills"]);
	});
});
