import { formatBaht } from "../lib/money";

type Props = {
	budget: number;
	monthSpent: number;
	spentToday: number;
	leftToday: number;
	overMonth: boolean;
	overToday: boolean;
};

// One bar for the whole month's budget with today marked inside it: what was spent before today,
// today's spend (darkest), and what is still free to spend today (outlined).
export function BudgetBar({ budget, monthSpent, spentToday, leftToday, overMonth, overToday }: Props) {
	const before = Math.max(0, monthSpent - spentToday);
	const free = Math.max(0, leftToday);
	const used = before + spentToday + free;
	const scale = used > budget ? budget / used : 1;
	const pct = (satang: number) => `${((satang * scale) / budget) * 100}%`;

	return (
		<div
			className={overMonth ? "budget-bar budget-bar--over" : overToday ? "budget-bar budget-bar--today-over" : "budget-bar"}
			role="img"
			aria-label={`${formatBaht(monthSpent)} of ${formatBaht(budget)} spent this month, ${formatBaht(spentToday)} of it today`}
		>
			<span className="budget-bar__before" style={{ width: pct(before) }} />
			<span className="budget-bar__today" style={{ width: pct(spentToday) }} />
			<span className="budget-bar__free" style={{ width: pct(free) }} />
		</div>
	);
}
