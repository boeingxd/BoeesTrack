import { daysLeftInMonth, dayKey, sameMonth } from "./dates";
import { ownSpending } from "./shares";
import type { BudgetPlan, Entry } from "./types";

export type Standing = {
	mode: "auto" | "fixed" | "off";
	monthSpent: number;
	monthLeft: number;
	daysLeft: number;
	spentToday: number;
	todayAllowance: number;
	leftToday: number;
	tomorrowAllowance: number | null;
	overToday: boolean;
	overMonth: boolean;
};

const wholeBaht = (satang: number) => Math.max(0, Math.floor(satang / 100) * 100);

// Derived daily allowance: what is left of the month's budget, spread over the days still to go (today included).
// Only your own spending counts (friends' parts of a bill do not), and not what was paid from a savings pot. Overspending today lowers tomorrow's figure because it comes out of the same pool.
export function standing(entries: Entry[], plan: BudgetPlan, today: Date): Standing {
	const budget = plan.monthly;
	const todayKey = dayKey(today);
	const spent = ownSpending(entries).filter((e) => !e.pot && sameMonth(e.at, today));
	const spentToday = spent.filter((e) => dayKey(e.at) === todayKey).reduce((s, e) => s + e.satang, 0);
	const monthSpent = spent.reduce((s, e) => s + e.satang, 0);
	const spentBefore = monthSpent - spentToday;
	const daysLeft = daysLeftInMonth(today);

	const mode = plan.daily === "auto" ? "auto" : plan.daily === "off" ? "off" : "fixed";
	const fixed = typeof plan.daily === "object" ? plan.daily.fixed : 0;
	const todayAllowance = mode === "fixed" ? fixed : mode === "off" ? 0 : wholeBaht((budget - spentBefore) / daysLeft);
	const tomorrowAllowance =
		daysLeft === 1 || mode === "off" ? null : mode === "fixed" ? fixed : wholeBaht((budget - monthSpent) / (daysLeft - 1));

	return {
		mode,
		monthSpent,
		monthLeft: budget - monthSpent,
		daysLeft,
		spentToday,
		todayAllowance,
		leftToday: todayAllowance - spentToday,
		tomorrowAllowance,
		overToday: mode !== "off" && spentToday > todayAllowance,
		overMonth: monthSpent > budget,
	};
}

// A share of the balance as a monthly budget, in whole baht. Nothing to share when the balance is zero or below.
export function fromBalance(balanceSatang: number, percent: number): number {
	return wholeBaht((balanceSatang * percent) / 100);
}
