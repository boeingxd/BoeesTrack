import { useMemo, useState } from "react";
import { BudgetBar } from "../components/BudgetBar";
import { DayList } from "../components/DayList";
import { Figure } from "../components/Figure";
import { Icon } from "../components/Icon";
import { ViewSwitch, type View } from "../components/ViewSwitch";
import { standing } from "../lib/allowance";
import { balance } from "../lib/balance";
import { groupByDay, monthTitle } from "../lib/dates";
import { formatBaht } from "../lib/money";
import { inputToSatang } from "../lib/money";
import type { BudgetPlan, Entry } from "../lib/types";

// Home shows today and the days just before it; everything older lives in the History tab.
const HOME_DAYS = 4;

type Props = {
	entries: Entry[];
	plan: BudgetPlan;
	today: Date;
	intro: boolean;
	justAddedId: string | null;
	onAdd: () => void;
	onSlips: () => void;
	onView: (view: View) => void;
	onOpenEntry: (entry: Entry) => void;
	onCheckIn: (bankSatang: number) => void;
	onBudget: () => void;
};

export function Home({ entries, plan, today, intro, justAddedId, onAdd, onSlips, onView, onOpenEntry, onCheckIn, onBudget }: Props) {
	const budget = plan.monthly;
	const groups = useMemo(() => groupByDay(entries, today).slice(0, HOME_DAYS), [entries, today]);
	const s = useMemo(() => standing(entries, plan, today), [entries, plan, today]);
	const held = useMemo(() => balance(entries), [entries]);
	const [checking, setChecking] = useState(false);
	const [bank, setBank] = useState("");
	const bankSatang = inputToSatang(bank.replace(/[^\d.]/g, ""));
	const gap = bank === "" ? 0 : bankSatang - held;
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
						Budget {formatBaht(budget)}
						<Icon name="edit" size={14} />
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

				<div className="balance-row">
					<p>
						<span className="balance-row__label">Balance</span> <strong>{formatBaht(held)}</strong>
					</p>
					<button type="button" className="balance-row__check" aria-expanded={checking} onClick={() => setChecking(!checking)}>
						Check
						<Icon name="down" size={16} />
					</button>
				</div>
				{checking && (
					<div className="balance-check">
						<input
							className="bank-input"
							inputMode="decimal"
							value={bank}
							onChange={(event) => setBank(event.target.value.replace(/[^\d.]/g, ""))}
							aria-label="Your real bank balance, in baht"
							placeholder="What your bank says"
							maxLength={10}
						/>
						{bank !== "" && (
							<p className="today__note">
								{gap === 0
									? "Matches the app."
									: `The app is ${formatBaht(Math.abs(gap))} ${gap < 0 ? "above" : "below"} your bank. This adds a ${gap > 0 ? "+" : ""}${formatBaht(gap)} adjustment.`}
							</p>
						)}
						<button
							type="button"
							className="confirm"
							disabled={gap === 0}
							onClick={() => {
								onCheckIn(bankSatang);
								setBank("");
								setChecking(false);
							}}
						>
							Add adjustment
						</button>
					</div>
				)}
			</section>

			<section className="sheet" aria-label="Entries by day" style={{ "--i": 2 } as React.CSSProperties}>
				<DayList groups={groups} today={today} justAddedId={justAddedId} onOpenEntry={onOpenEntry} />
			</section>

			<footer className="dock">
				<button type="button" className="dock__add" onClick={onAdd}>
					<Icon name="plus" />
					Add
				</button>
				<button type="button" className="dock__slips" onClick={onSlips}>
					<Icon name="clip" size={18} />
					Slips
				</button>
			</footer>
		</main>
	);
}
