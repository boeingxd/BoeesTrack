import { shortDay } from "../lib/dates";
import { formatBaht } from "../lib/money";
import type { DayTotal, MonthWeek } from "../lib/stats";

type Props = {
	days: DayTotal[];
	todayKey: string;
	// Only the week's seven wide bars are tappable; a month's 28-31 are too narrow for a finger, so a month taps a whole week band instead.
	onOpenDay?: (date: Date) => void;
	weeks?: MonthWeek[];
	onOpenWeek?: (date: Date) => void;
	// A dashed average line, drawn as one segment per column so the segments join up.
	average?: number;
};

const WEEKDAY_LETTERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Ink-only bars, one per day, the same height scale across the range. Today is the darkest.
export function DayBars({ days, todayKey, onOpenDay, weeks, onOpenWeek, average = 0 }: Props) {
	const peak = Math.max(1, ...days.map((day) => day.satang), average);
	const wide = onOpenDay !== undefined;

	const dayLabel = (day: DayTotal) => `${shortDay(day.date)}, ${day.satang === 0 ? "nothing spent" : formatBaht(day.satang)}`;
	const bar = (day: DayTotal) => {
		const height = day.satang === 0 ? 0 : Math.max(4, Math.round((day.satang / peak) * 100));
		return (
			<>
				{wide && <span className="bar__value">{day.satang === 0 ? "" : Math.round(day.satang / 100).toLocaleString("en-GB")}</span>}
				<span className="bar__track">
					<span className={day.key === todayKey ? "bar bar--today" : "bar"} style={{ height: `${height}%` }} />
					{average > 0 && <span className="bar__avg" style={{ bottom: `${(average / peak) * 100}%` }} />}
				</span>
				{wide && <span className="bar__label">{WEEKDAY_LETTERS[day.date.getDay()]}</span>}
			</>
		);
	};

	return (
		<ol className={wide ? "bars bars--week" : "bars bars--month"} aria-hidden={wide ? undefined : true}>
			{weeks && onOpenWeek
				? weeks.map((week) => {
						const first = week.days[0].date;
						const columns = week.days.map((day) => (
							<span className="bars__col" key={day.key}>
								<span className="bars__btn">{bar(day)}</span>
							</span>
						));
						return (
							<li className="bars__week" key={week.key} style={{ flexGrow: week.days.length }}>
								{week.future ? (
									<span className="bars__band">{columns}</span>
								) : (
									// The week rows under the chart are the accessible way in, so this band stays out of the tab order.
									<button type="button" className="bars__band" tabIndex={-1} onClick={() => onOpenWeek(first)}>
										{columns}
									</button>
								)}
								<span className="bars__week-label">{first.getDate()}</span>
							</li>
						);
					})
				: days.map((day) => (
						<li className="bars__col" key={day.key}>
							{wide ? (
								<button
									type="button"
									className="bars__btn"
									aria-label={`${dayLabel(day)}. Open this day`}
									onClick={() => onOpenDay(day.date)}
								>
									{bar(day)}
								</button>
							) : (
								<span className="bars__btn">{bar(day)}</span>
							)}
						</li>
					))}
		</ol>
	);
}
