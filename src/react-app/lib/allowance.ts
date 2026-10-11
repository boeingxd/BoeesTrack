import { daysLeftInMonth, dayKey, sameMonth } from "./dates";
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
// Only "spent" entries count, and not those paid from a savings pot. Overspending today lowers tomorrow's figure because it comes out of the same pool.
export function standing(entries: Entry[], plan: BudgetPlan, today: Date): Standing {
	const budget = plan.monthly;
	const todayKey = dayKey(today);
	const spent = entries.filter((e) => e.kind === "spent" && !e.pot && sameMonth(e.at, today));
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
