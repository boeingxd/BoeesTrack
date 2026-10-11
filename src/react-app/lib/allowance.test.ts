import { describe, expect, it } from "vitest";
import { standing } from "./allowance";
import type { Entry } from "./types";

const baht = (n: number) => n * 100;
// 8 October 2026 has 24 days left including today (8..31).
const today = new Date(2026, 9, 8, 14, 0);

function spent(day: number, amount: number, kind: Entry["kind"] = "spent"): Entry {
	return {
		id: `${day}-${amount}-${kind}`,
		kind,
		satang: baht(amount),
		at: new Date(2026, 9, day, 12, 0),
		category: null,
		note: "",
	};
}

describe("standing", () => {
	it("spreads what is left of the month over the days still to go", () => {
		const s = standing([spent(2, 7_000)], baht(20_000), today);
		expect(s.daysLeft).toBe(24);
		expect(s.todayAllowance).toBe(baht(541)); // 13,000 / 24 = 541.66, rounded down
		expect(s.leftToday).toBe(baht(541));
		expect(s.overToday).toBe(false);
	});

	it("counts only spent entries, not received or saved ones", () => {
		const s = standing(
			[spent(2, 7_000), spent(3, 2_500, "received"), spent(4, 1_000, "saved")],
			baht(20_000),
			today,
		);
		expect(s.monthSpent).toBe(baht(7_000));
	});

	it("lowers tomorrow's allowance when today goes over", () => {
		const before = standing([spent(2, 7_000)], baht(20_000), today);
		const after = standing([spent(2, 7_000), spent(8, 1_200)], baht(20_000), today);
		expect(after.overToday).toBe(true);
		expect(after.leftToday).toBe(baht(541 - 1_200));
		expect(after.tomorrowAllowance!).toBeLessThan(before.tomorrowAllowance!);
		expect(after.tomorrowAllowance).toBe(baht(513)); // (20,000 - 8,200) / 23
	});

	it("shows a zero allowance once the month is overspent", () => {
		const s = standing([spent(2, 21_000)], baht(20_000), today);
		expect(s.overMonth).toBe(true);
		expect(s.todayAllowance).toBe(0);
	});

	it("has no tomorrow on the last day of the month", () => {
		const s = standing([], baht(20_000), new Date(2026, 9, 31, 9, 0));
		expect(s.daysLeft).toBe(1);
		expect(s.tomorrowAllowance).toBeNull();
	});

	it("ignores spending from other months", () => {
		const old: Entry = { ...spent(2, 9_000), at: new Date(2026, 8, 20, 12, 0) };
		expect(standing([old], baht(20_000), today).monthSpent).toBe(0);
	});
});
