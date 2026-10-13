import { useMemo } from "react";
import { DayBars } from "../components/DayBars";
import { DayList } from "../components/DayList";
import { Figure } from "../components/Figure";
import { Icon } from "../components/Icon";
import { Meter } from "../components/Meter";
import { ScaleSwitch } from "../components/ViewSwitch";
import { dayKey, dayMonth, groupByDay } from "../lib/dates";
import { formatBaht } from "../lib/money";
import {
	categoryBreakdown,
	dailyTotals,
	flows,
	habits,
	monthWeeks,
	NO_CATEGORY,
	periodRange,
	periodTitle,
	previousRange,
	shiftAnchor,
	topSpends,
	type Scale,
} from "../lib/stats";
import type { Entry } from "../lib/types";

type Props = {
	entries: Entry[];
	today: Date;
	scale: Scale;
	anchor: Date;
	onAnchor: (anchor: Date) => void;
	onScale: (scale: Scale) => void;
	onOpenDay: (date: Date) => void;
	onOpenWeek: (date: Date) => void;
	onOpenCategory: (category: string) => void;
	onOpenHistory: () => void;
	onOpenEntry: (entry: Entry) => void;
};

const share = (value: number) => (value > 0 && value < 0.01 ? "<1%" : `${Math.round(value * 100)}%`);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function StatsOld({ entries, today, scale, anchor, onAnchor, onScale, onOpenDay, onOpenWeek, onOpenCategory, onOpenHistory, onOpenEntry }: Props) {
	const range = useMemo(() => periodRange(scale, anchor), [scale, anchor]);
	const { range: earlier, partial } = useMemo(() => previousRange(scale, anchor, today), [scale, anchor, today]);
	const current = range.to.getTime() > today.getTime();

	const breakdown = useMemo(() => categoryBreakdown(entries, range, earlier), [entries, range, earlier]);
	const before = useMemo(() => categoryBreakdown(entries, earlier).total, [entries, earlier]);
	const days = useMemo(() => dailyTotals(entries, range), [entries, range]);
	const weeks = useMemo(() => (scale === "month" ? monthWeeks(days, today) : []), [scale, days, today]);
	const biggest = useMemo(() => topSpends(entries, range), [entries, range]);
	const habit = useMemo(() => habits(entries, range, today), [entries, range, today]);

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

	const hasEarlier = useMemo(() => entries.some((entry) => entry.at.getTime() < range.from.getTime()), [entries, range]);
	const inOut = useMemo(() => flows(entries, range), [entries, range]);
	// Two bars, this period against the one before, on one shared scale (the longer is full width).
	const longest = Math.max(breakdown.total, before);
	const word = scale === "day" ? "day" : scale === "week" ? "week" : "month";
	const nowName = scale === "day" ? (current ? "Today" : "That day") : `${current ? "This" : "That"} ${word}`;
	const beforeName = `${scale === "day" ? "Day" : scale === "week" ? "Week" : "Month"} before`;
	const heroLabel = (verb: string) => (current && scale === "day" ? `${verb} today` : `${verb} ${current ? "this" : "that"} ${word}`);

	return (
		<main className="home">
			<section className="today" aria-labelledby="stats-label">
				<div className="ledger-head__top">
					<h1 className="month">{periodTitle(scale, range, today)}</h1>
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
				<div className="hero-main">
					<p className="today__label" id="stats-label">
						{heroLabel("Spent")}
					</p>
					<p className="today__figure" aria-live="polite">
						<Figure satang={breakdown.total} />
					</p>
				</div>
				<div className="hero-pair">
					<div>
						<p className="today__label">{heroLabel("Saved")}</p>
						<p className="today__figure" aria-live="polite">
							<Figure satang={inOut.saved} />
						</p>
					</div>
					<div className="hero-pair__end">
						<p className="today__label">{heroLabel("Received")}</p>
						<p className="today__figure" aria-live="polite">
							<Figure satang={inOut.received} />
						</p>
					</div>
				</div>
				{!hasEarlier ? (
					<p className="today__note">No earlier data to compare with yet.</p>
				) : (
					longest > 0 && (
						<ul className="meters" aria-label="Spent compared with the period before">
							<Meter name={nowName} value={breakdown.total} max={longest} amount={formatBaht(breakdown.total)} />
							<Meter name={beforeName} note={partial ? "same days" : undefined} value={before} max={longest} tone="edge" amount={formatBaht(before)} />
						</ul>
					)
				)}
				{breakdown.count === 0 && <p className="today__note">Nothing spent in this {word}.</p>}
			</section>

			{scale !== "day" && (
				<section className="stat" aria-label="Day by day">
					<h2 className="day__head">
						<span>Day by day</span>
						{habit.avgPerDay > 0 && <span className="day__sum">avg {formatBaht(habit.avgPerDay)}</span>}
					</h2>
					<div className="bars-wrap">
						<DayBars
							days={days}
							todayKey={dayKey(today)}
							onOpenDay={scale === "week" ? onOpenDay : undefined}
							weeks={scale === "month" ? weeks : undefined}
							onOpenWeek={scale === "month" ? onOpenWeek : undefined}
							average={habit.avgPerDay}
						/>
					</div>
					{scale === "month" && (
						<ul className="day__lines">
							{weeks
								.filter((week) => !week.future)
								.map((week) => {
									const first = week.days[0].date;
									const last = week.days[week.days.length - 1].date;
									const name = week.days.length === 1 ? dayMonth(first) : `${first.getDate()}–${dayMonth(last)}`;
									return (
										<li key={week.key}>
											<button
												type="button"
												className="line line--link"
												aria-label={`${name}, ${formatBaht(week.satang)}, ${share(week.share)}. Open this week`}
												onClick={() => onOpenWeek(first)}
											>
												<span className="line__time">{share(week.share)}</span>
												<span className="line__body">
													<span className="line__what">{name}</span>
												</span>
												<span className="line__amount">{formatBaht(week.satang)}</span>
											</button>
										</li>
									);
								})}
						</ul>
					)}
				</section>
			)}

			{scale === "day" && (
				<section className="sheet sheet--page" aria-label="Entries that day">
					<DayList groups={dayGroups} today={today} onOpenEntry={onOpenEntry} />
				</section>
			)}

			<section className="sheet sheet--page stat" aria-label="Spending">
				<h2 className="day__head">
					<span>Spending</span>
					<button type="button" className="text-btn" onClick={onOpenHistory}>
						See all entries
					</button>
				</h2>
				<h3 className="stat-sub">Where it went</h3>
				<ul className="day__lines">
					{breakdown.rows.length === 0 ? (
						<li className="line line--empty">
							<span className="line__body">Nothing to show</span>
						</li>
					) : (
						breakdown.rows.map((row) => {
							return (
								<li key={row.category}>
									<button
										type="button"
										className="line line--link"
										aria-label={`${row.category}, ${formatBaht(row.satang)}, ${share(row.share)}, ${plural(row.count, "purchase")}. Show these entries`}
										onClick={() => onOpenCategory(row.category)}
									>
										<span className="line__time">{share(row.share)}</span>
										<span className="line__body">
											<span className="line__what">{row.category}</span>
											<span className="line__note">
												{plural(row.count, "purchase")}
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

				{scale !== "day" && biggest.length > 0 && (
					<>
						<h3 className="stat-sub">Biggest</h3>
						<ul className="day__lines">
							{biggest.map((entry) => (
								<li key={entry.id}>
									<button
										type="button"
										className="line line--link"
										aria-label={`${entry.category ?? NO_CATEGORY}, ${formatBaht(entry.satang)}, ${dayMonth(entry.at)}. Show details`}
										onClick={() => onOpenEntry(entry)}
									>
										<time className="line__time">{dayMonth(entry.at)}</time>
										<span className="line__body">
											<span className="line__what">{entry.category ?? NO_CATEGORY}</span>
											{entry.note && <span className="line__note">{entry.note}</span>}
											<span className="share" aria-hidden="true">
												<span style={{ width: `${Math.max(2, Math.round((entry.satang / biggest[0].satang) * 100))}%` }} />
											</span>
										</span>
										<span className="line__amount">{formatBaht(entry.satang)}</span>
									</button>
								</li>
							))}
						</ul>
					</>
				)}
			</section>
		</main>
	);
}
