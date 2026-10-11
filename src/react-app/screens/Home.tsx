import { useMemo } from "react";
import { BudgetBar } from "../components/BudgetBar";
import { DayList } from "../components/DayList";
import { Figure } from "../components/Figure";
import { Icon } from "../components/Icon";
import { ViewSwitch, type View } from "../components/ViewSwitch";
import { standing } from "../lib/allowance";
import { balance, potTotals } from "../lib/balance";
import { groupByDay, monthTitle } from "../lib/dates";
import { formatBaht } from "../lib/money";
import type { BudgetPlan, Entry, Pot } from "../lib/types";

// Home shows today and the days just before it; everything older lives in History.
const HOME_DAYS = 4;

type Props = {
	entries: Entry[];
	plan: BudgetPlan;
	pots: Pot[];
	today: Date;
	intro: boolean;
	justAddedId: string | null;
	onAdd: () => void;
	onSlips: () => void;
	onView: (view: View) => void;
	onHistory: () => void;
	onMoney: () => void;
	onBudget: () => void;
};

export function Home({ entries, plan, pots, today, intro, justAddedId, onAdd, onSlips, onView, onHistory, onMoney, onBudget }: Props) {
	const budget = plan.monthly;
	const groups = useMemo(() => groupByDay(entries, today).slice(0, HOME_DAYS), [entries, today]);
	const s = useMemo(() => standing(entries, plan, today), [entries, plan, today]);
	const held = useMemo(() => balance(entries), [entries]);
	const saved = useMemo(() => potTotals(entries, pots, today).reduce((sum, p) => sum + p.total, 0), [entries, pots, today]);
	const overBy = formatBaht(Math.abs(s.leftToday));

	return (
		<main className={intro ? "home home--intro" : "home"}>
			<header className="topnav" style={{ "--i": 0 } as React.CSSProperties}>
				<ViewSwitch value="home" onChange={onView} />
			</header>

			<section className="today" aria-labelledby="today-label" style={{ "--i": 1 } as React.CSSProperties}>
				<div className="ledger-head__top">
					<h1 className="month">{monthTitle(today)}</h1>
					<p className="sample-note">Sample data</p>
				</div>
				<p className="today__label" id="today-label">
					Spent today
				</p>
				<p className="today__figure" aria-live="polite">
					<Figure satang={s.spentToday} />
				</p>
				<BudgetBar
					budget={budget}
					monthSpent={s.monthSpent}
					spentToday={s.spentToday}
					leftToday={s.leftToday}
					overMonth={s.overMonth}
					overToday={s.overToday}
				/>
				<p className="budget-labels">
					<span>
						<strong>{formatBaht(s.monthSpent)}</strong> this month
					</span>
					<button type="button" className="budget-labels__set" onClick={onBudget} aria-label={`Budget ${formatBaht(budget)} a month, change`}>
						of {formatBaht(budget)}
					</button>
				</p>
				{s.overToday || s.overMonth ? (
					<p className="today__note today__note--warn" role="status">
						<Icon name="warning" size={18} />
						<span>
							{s.overMonth
								? s.mode === "auto"
									? "The month's budget is used up, so today's allowance is ฿0."
									: `${formatBaht(-s.monthLeft)} over the month's budget.`
								: `${overBy} over today's ${formatBaht(s.todayAllowance)}.`}
							{!s.overMonth && s.mode === "auto" && s.tomorrowAllowance !== null && ` Tomorrow's allowance drops to ${formatBaht(s.tomorrowAllowance)}.`}
						</span>
					</p>
				) : (
					<p className="today__note">
						{s.mode === "off" ? (
							<>
								<strong>{formatBaht(s.monthLeft)}</strong> left this month
							</>
						) : (
							<>
								<strong>{formatBaht(s.leftToday)}</strong> left of today's {formatBaht(s.todayAllowance)}
							</>
						)}{" "}
						·{" "}
						<span className="nowrap">
							{s.daysLeft} {s.daysLeft === 1 ? "day" : "days"} left
						</span>
					</p>
				)}
			</section>

			<section className="sheet" aria-label="Entries by day" style={{ "--i": 2 } as React.CSSProperties}>
				<div className="more-line more-line--top">
					<button type="button" className="more-line__btn" onClick={onMoney}>
						<span>
							Balance <strong>{formatBaht(held)}</strong> · Saved <strong>{formatBaht(saved)}</strong>
						</span>
						<Icon name="forward" size={18} />
					</button>
				</div>

				<DayList groups={groups} today={today} justAddedId={justAddedId} />

				<div className="more-line">
					<button type="button" className="more-line__btn" onClick={onHistory}>
						<span>All history</span>
						<Icon name="forward" size={18} />
					</button>
				</div>
			</section>

			<footer className="dock">
				<button type="button" className="dock__add" onClick={onAdd}>
					<Icon name="plus" />
					Add a spend
				</button>
				<button type="button" className="dock__slips" onClick={onSlips}>
					<Icon name="clip" size={18} />
					Slips
				</button>
			</footer>
		</main>
	);
}
