import { useMemo } from "react";
import { DayBars } from "../components/DayBars";
import { DayList } from "../components/DayList";
import { Figure } from "../components/Figure";
import { Icon } from "../components/Icon";
import { ScaleSwitch, ViewSwitch, type View } from "../components/ViewSwitch";
import { standing } from "../lib/allowance";
import { addDays, dayKey, dayMonth, dayTitle, groupByDay, monthKey, monthTitle, shortDay, weekdayName } from "../lib/dates";
import { formatBaht } from "../lib/money";
import {
	categoryBreakdown,
	dailyTotals,
	flows,
	habits,
	NO_CATEGORY,
	periodRange,
	previousRange,
	shiftAnchor,
	topSpends,
	type Range,
	type Scale,
} from "../lib/stats";
import type { BudgetPlan, Entry } from "../lib/types";

type Props = {
	entries: Entry[];
	plan: BudgetPlan;
	today: Date;
	scale: Scale;
	anchor: Date;
	onAnchor: (anchor: Date) => void;
	onScale: (scale: Scale) => void;
	onView: (view: View) => void;
	onOpenDay: (date: Date) => void;
	onOpenCategory: (category: string, month: string) => void;
};

const share = (value: number) => (value > 0 && value < 0.01 ? "<1%" : `${Math.round(value * 100)}%`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const signed = (satang: number) => `${satang > 0 ? "+" : "−"}${formatBaht(Math.abs(satang))}`;

function title(scale: Scale, range: Range, today: Date): string {
	if (scale === "day") return dayTitle(range.from, today);
	if (scale === "month") return monthTitle(range.from);
	return `${dayMonth(range.from)} – ${dayMonth(addDays(range.to, -1))}`;
}

const reference = (scale: Scale, partial: boolean) => `the ${partial ? "same days of the " : ""}previous ${scale}`;

export function Stats({ entries, plan, today, scale, anchor, onAnchor, onScale, onView, onOpenDay, onOpenCategory }: Props) {
	const range = useMemo(() => periodRange(scale, anchor), [scale, anchor]);
	const { range: earlier, partial } = useMemo(() => previousRange(scale, anchor, today), [scale, anchor, today]);
	const current = range.to.getTime() > today.getTime();
	const lastDay = addDays(range.to, -1);

	const breakdown = useMemo(() => categoryBreakdown(entries, range, earlier), [entries, range, earlier]);
	const before = useMemo(() => categoryBreakdown(entries, earlier).total, [entries, earlier]);
	const days = useMemo(() => dailyTotals(entries, range), [entries, range]);
	const biggest = useMemo(() => topSpends(entries, range), [entries, range]);
	const habit = useMemo(() => habits(entries, range, earlier, today), [entries, range, earlier, today]);

	// A day's allowance is worked out as it stood at the end of that day, so later spending does not leak in.
	const day = useMemo(
		() => (scale === "day" ? standing(entries.filter((entry) => entry.at.getTime() < range.to.getTime()), plan, range.from) : null),
		[scale, entries, plan, range],
	);
	const dayGroups = useMemo(
		() =>
			scale === "day"
				? groupByDay(
						entries.filter((entry) => entry.at.getTime() >= range.from.getTime() && entry.at.getTime() < range.to.getTime()),
						range.from,
					)
				: [],
		[scale, entries, range],
	);

	const peak = days.reduce((top, d) => (d.satang > top.satang ? d : top), days[0]);
	const hasEarlier = useMemo(() => entries.some((entry) => entry.at.getTime() < range.from.getTime()), [entries, range]);
	const inOut = useMemo(() => flows(entries, range), [entries, range]);
	// Two bars, this period against the one before, on one shared scale (the longer is full width).
	const longest = Math.max(breakdown.total, before);
	const barWidth = (satang: number) => `${satang === 0 ? 0 : Math.max(2, (satang / longest) * 100)}%`;
	const dayAllowance = day && day.mode !== "off" ? day : null;
	// shortcut: History filters by month only, so a day or week opens its whole month; add a date-range filter if that bothers.
	const historyMonth = monthKey(lastDay.getTime() > today.getTime() ? today : lastDay);
	const word = scale === "day" ? "day" : scale === "week" ? "week" : "month";
	const nowName = scale === "day" ? (current ? "Today" : "That day") : `${current ? "This" : "That"} ${word}`;
	const beforeName = `${scale === "day" ? "Day" : scale === "week" ? "Week" : "Month"} before`;
	const heroLabel = (verb: string) => (current && scale === "day" ? `${verb} today` : `${verb} ${current ? "this" : "that"} ${word}`);

	return (
		<main className="home">
			<header className="topnav">
				<ViewSwitch value="stats" onChange={onView} />
			</header>

			<section className="today" aria-labelledby="stats-label">
				<div className="ledger-head__top">
					<h1 className="month">{title(scale, range, today)}</h1>
					<div className="month-nav">
						<button
							type="button"
							className="icon-btn"
							aria-label={`Previous ${word}`}
							onClick={() => onAnchor(shiftAnchor(scale, anchor, -1))}
						>
							<Icon name="back" />
						</button>
						<button
							type="button"
							className="icon-btn"
							aria-label={`Next ${word}`}
							disabled={current}
							onClick={() => onAnchor(shiftAnchor(scale, anchor, 1))}
						>
							<Icon name="forward" />
						</button>
					</div>
				</div>
				<ScaleSwitch scale={scale} onChange={onScale} />
				<div className="hero-pair">
					<div>
						<p className="today__label" id="stats-label">
							{heroLabel("Spent")}
						</p>
						<p className="today__figure" aria-live="polite">
							<Figure satang={breakdown.total} />
						</p>
					</div>
					<div>
						<p className="today__label">{heroLabel("Saved")}</p>
						<p className="today__figure" aria-live="polite">
							<Figure satang={inOut.saved} />
						</p>
					</div>
				</div>
				{dayAllowance && (
					<div className="allowance">
						<div
							className={dayAllowance.leftToday < 0 ? "budget-bar budget-bar--over" : "budget-bar"}
							role="img"
							aria-label={`${formatBaht(dayAllowance.spentToday)} spent of that day's ${formatBaht(dayAllowance.todayAllowance)} allowance`}
						>
							<span
								className="budget-bar__today"
								style={{ width: `${(dayAllowance.spentToday / Math.max(dayAllowance.spentToday, dayAllowance.todayAllowance, 1)) * 100}%` }}
							/>
							<span
								className="budget-bar__free"
								style={{ width: `${(Math.max(0, dayAllowance.leftToday) / Math.max(dayAllowance.spentToday, dayAllowance.todayAllowance, 1)) * 100}%` }}
							/>
						</div>
						<p className={dayAllowance.leftToday < 0 ? "allowance__text allowance__text--warn" : "allowance__text"}>
							{dayAllowance.leftToday < 0 && <Icon name="warning" size={16} />}
							{formatBaht(Math.abs(dayAllowance.leftToday))} {dayAllowance.leftToday < 0 ? "over" : "left"}
						</p>
					</div>
				)}
				{!hasEarlier ? (
					<p className="today__note">No earlier data to compare with yet.</p>
				) : (
					longest > 0 && (
						<ul className="compare" aria-label="Spent compared with the period before">
							{[
								{ name: nowName, note: null, satang: breakdown.total, mine: true },
								{ name: beforeName, note: partial ? "same days" : null, satang: before, mine: false },
							].map((row) => (
								<li className="compare__row" key={row.name}>
									<span className="compare__name">
										{row.name}
										{row.note && <span className="compare__note">{row.note}</span>}
									</span>
									<span className="compare__track" aria-hidden="true">
										<span className={row.mine ? "compare__fill" : "compare__fill compare__fill--before"} style={{ width: barWidth(row.satang) }} />
									</span>
									<span className="compare__amount">{formatBaht(row.satang)}</span>
								</li>
							))}
						</ul>
					)
				)}
				{breakdown.count === 0 && <p className="today__note">Nothing spent in this {word}.</p>}
			</section>

			{scale !== "day" && (
				<section className="stat" aria-label="Day by day">
					<h2 className="day__head">
						<span>Day by day</span>
						{scale === "month" && peak.satang > 0 && (
							<span className="day__sum">
								Peak {shortDay(peak.date)} · {formatBaht(peak.satang)}
							</span>
						)}
					</h2>
					<div className="bars-wrap">
						<DayBars
							days={days}
							todayKey={dayKey(today)}
							onOpenDay={scale === "week" ? onOpenDay : undefined}
						/>
						{scale === "month" && (
							<p className="bars-foot">
								<span>{dayMonth(range.from)}</span>
								<span>{dayMonth(lastDay)}</span>
							</p>
						)}
					</div>
				</section>
			)}

			{scale === "day" && (
				<section className="sheet sheet--page" aria-label="Entries that day">
					<DayList groups={dayGroups} today={today} />
				</section>
			)}

			<section className="sheet sheet--page stat" aria-label="Where it went">
				<h2 className="day__head">
					<span>Where it went</span>
					<span className="day__sum">Spent</span>
				</h2>
				{before > 0 && <p className="stat-note">+ and − compare with {reference(scale, partial)}.</p>}
				<ul className="day__lines">
					{breakdown.rows.length === 0 ? (
						<li className="line line--empty">
							<span className="line__body">Nothing to show</span>
						</li>
					) : (
						breakdown.rows.map((row) => {
							const change = row.satang - row.before;
							return (
								<li key={row.category}>
									<button
										type="button"
										className="line line--link"
										aria-label={`${row.category}, ${formatBaht(row.satang)}, ${share(row.share)}, ${plural(row.count, "purchase")}. Show these entries`}
										onClick={() => onOpenCategory(row.category, historyMonth)}
									>
										<span className="line__time">{share(row.share)}</span>
										<span className="line__body">
											<span className="line__what">{row.category}</span>
											<span className="line__note">
												{plural(row.count, "purchase")}
												{before > 0 && change !== 0 && ` · ${signed(change)}`}
											</span>
											<span className="share" aria-hidden="true">
												<span style={{ width: `${Math.max(2, Math.round(row.share * 100))}%` }} />
											</span>
										</span>
										<span className="line__amount">{formatBaht(row.satang)}</span>
									</button>
								</li>
							);
						})
					)}
				</ul>
			</section>

			{scale !== "day" && biggest.length > 0 && (
				<section className="sheet sheet--page stat" aria-label="Biggest spends">
					<h2 className="day__head">
						<span>Biggest spends</span>
					</h2>
					<ul className="day__lines">
						{biggest.map((entry) => (
							<li className="line" key={entry.id}>
								<time className="line__time">{dayMonth(entry.at)}</time>
								<span className="line__body">
									<span className="line__what">{entry.category ?? NO_CATEGORY}</span>
									{entry.note && <span className="line__note">{entry.note}</span>}
								</span>
								<span className="line__amount">{formatBaht(entry.satang)}</span>
							</li>
						))}
					</ul>
				</section>
			)}

			{scale !== "day" && breakdown.count > 0 && (
				<section className="sheet sheet--page stat" aria-label="Habits">
					<h2 className="day__head">
						<span>Habits</span>
					</h2>
					<ul className="day__lines">
						<li className="line">
							<span aria-hidden="true" />
							<span className="line__body">Average per day</span>
							<span className="line__amount">{formatBaht(habit.avgPerDay)}</span>
						</li>
						{scale === "month" && habit.busiest && (
							<li className="line">
								<span aria-hidden="true" />
								<span className="line__body">
									Busiest weekday
									<span className="line__note">{weekdayName(habit.busiest.weekday)}, on average</span>
								</span>
								<span className="line__amount">{formatBaht(habit.busiest.satang)}</span>
							</li>
						)}
						{habit.riser && (
							<li className="line">
								<span aria-hidden="true" />
								<span className="line__body">
									Grew most
									<span className="line__note">{habit.riser.category}</span>
								</span>
								<span className="line__amount">{signed(habit.riser.delta)}</span>
							</li>
						)}
					</ul>
				</section>
			)}

			<section className="sheet sheet--page stat" aria-label="Money in and out">
				<h2 className="day__head">
					<span>Money in and out</span>
				</h2>
				<ul className="day__lines">
					{inOut.received + inOut.spent + inOut.saved === 0 ? (
						<li className="line line--empty">
							<span className="line__body">No money in or out in this {word}.</span>
						</li>
					) : (
						<>
							<li className="line">
								<span aria-hidden="true" />
								<span className="line__body">Received</span>
								<span className="line__amount">{inOut.received > 0 && "+"}{formatBaht(inOut.received)}</span>
							</li>
							<li className="line">
								<span aria-hidden="true" />
								<span className="line__body">Spent</span>
								<span className="line__amount">{formatBaht(inOut.spent)}</span>
							</li>
							<li className="line">
								<span aria-hidden="true" />
								<span className="line__body">
									Saved
									{inOut.received > 0 && <span className="line__note">{share(inOut.saved / inOut.received)} of what came in</span>}
								</span>
								<span className="line__amount">{formatBaht(inOut.saved)}</span>
							</li>
						</>
					)}
				</ul>
			</section>
		</main>
	);
}
