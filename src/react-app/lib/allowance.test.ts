import { describe, expect, it } from "vitest";
import { fromBalance, standing } from "./allowance";
import type { BudgetPlan, Entry } from "./types";

const baht = (n: number) => n * 100;
// 8 October 2026 has 24 days left including today (8..31).
const today = new Date(2026, 9, 8, 14, 0);
const auto = (n: number): BudgetPlan => ({ monthly: baht(n), daily: "auto" });

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
		const s = standing([spent(2, 7_000)], auto(20_000), today);
		expect(s.daysLeft).toBe(24);
		expect(s.todayAllowance).toBe(baht(541)); // 13,000 / 24 = 541.66, rounded down
		expect(s.leftToday).toBe(baht(541));
		expect(s.overToday).toBe(false);
	});

	it("counts only spent entries, not received or saved ones", () => {
		const s = standing(
			[spent(2, 7_000), spent(3, 2_500, "received"), spent(4, 1_000, "saved")],
			auto(20_000),
			today,
		);
		expect(s.monthSpent).toBe(baht(7_000));
	});

	it("lowers tomorrow's allowance when today goes over", () => {
		const before = standing([spent(2, 7_000)], auto(20_000), today);
		const after = standing([spent(2, 7_000), spent(8, 1_200)], auto(20_000), today);
		expect(after.overToday).toBe(true);
		expect(after.leftToday).toBe(baht(541 - 1_200));
		expect(after.tomorrowAllowance!).toBeLessThan(before.tomorrowAllowance!);
		expect(after.tomorrowAllowance).toBe(baht(513)); // (20,000 - 8,200) / 23
	});

	it("shows a zero allowance once the month is overspent", () => {
		const s = standing([spent(2, 21_000)], auto(20_000), today);
		expect(s.overMonth).toBe(true);
		expect(s.todayAllowance).toBe(0);
	});

	it("has no tomorrow on the last day of the month", () => {
		const s = standing([], auto(20_000), new Date(2026, 9, 31, 9, 0));
		expect(s.daysLeft).toBe(1);
		expect(s.tomorrowAllowance).toBeNull();
	});

	it("ignores spending from other months", () => {
		const old: Entry = { ...spent(2, 9_000), at: new Date(2026, 8, 20, 12, 0) };
		expect(standing([old], auto(20_000), today).monthSpent).toBe(0);
	});

	it("ignores spending paid from a pot", () => {
		const fromPot: Entry = { ...spent(3, 500), pot: "Trip" };
		expect(standing([spent(2, 7_000), fromPot], auto(20_000), today).monthSpent).toBe(baht(7_000));
	});

	it("uses a fixed daily amount when one is set", () => {
		const plan: BudgetPlan = { monthly: baht(20_000), daily: { fixed: baht(600) } };
		const s = standing([spent(8, 700)], plan, today);
		expect(s.mode).toBe("fixed");
		expect(s.todayAllowance).toBe(baht(600));
		expect(s.overToday).toBe(true);
		expect(s.tomorrowAllowance).toBe(baht(600));
	});

	it("has no daily figures when the daily allowance is off", () => {
		const s = standing([spent(8, 900)], { monthly: baht(20_000), daily: "off" }, today);
		expect(s.mode).toBe("off");
		expect(s.overToday).toBe(false);
		expect(s.tomorrowAllowance).toBeNull();
		expect(s.monthLeft).toBe(baht(19_100));
	});
});

describe("fromBalance", () => {
	it("takes a share of the balance", () => {
		expect(fromBalance(baht(10_000), 30)).toBe(baht(3_000));
		expect(fromBalance(baht(10_000), 100)).toBe(baht(10_000));
	});
	it("rounds down to whole baht", () => {
		expect(fromBalance(baht(1_001), 33)).toBe(baht(330));
	});
	it("is zero when the balance is zero or negative", () => {
		expect(fromBalance(0, 30)).toBe(0);
		expect(fromBalance(-baht(500), 30)).toBe(0);
	});
});
