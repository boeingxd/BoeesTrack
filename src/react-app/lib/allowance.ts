import { daysLeftInMonth, dayKey, sameMonth } from "./dates";
import type { Entry } from "./types";

export type Standing = {
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
// Only "spent" entries count. Overspending today lowers tomorrow's figure because it comes out of the same pool.
export function standing(entries: Entry[], budget: number, today: Date): Standing {
	const todayKey = dayKey(today);
	const spent = entries.filter((e) => e.kind === "spent" && sameMonth(e.at, today));
	const spentToday = spent.filter((e) => dayKey(e.at) === todayKey).reduce((s, e) => s + e.satang, 0);
	const monthSpent = spent.reduce((s, e) => s + e.satang, 0);
	const spentBefore = monthSpent - spentToday;
	const daysLeft = daysLeftInMonth(today);

	const todayAllowance = wholeBaht((budget - spentBefore) / daysLeft);
	const tomorrowAllowance = daysLeft > 1 ? wholeBaht((budget - monthSpent) / (daysLeft - 1)) : null;

	return {
		monthSpent,
		monthLeft: budget - monthSpent,
		daysLeft,
		spentToday,
		todayAllowance,
		leftToday: todayAllowance - spentToday,
		tomorrowAllowance,
		overToday: spentToday > todayAllowance,
		overMonth: monthSpent > budget,
	};
}
