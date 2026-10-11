import { shortDay } from "../lib/dates";
import { formatBaht } from "../lib/money";
import type { DayTotal } from "../lib/stats";

type Props = {
	days: DayTotal[];
	todayKey: string;
	// Only the week's seven wide bars are tappable; a month's 28-31 are too narrow for a finger.
	onOpenDay?: (date: Date) => void;
	// A dashed average line, drawn as one segment per column so the segments join up.
	average?: number;
};

const WEEKDAY_LETTERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Ink-only bars, one per day, the same height scale across the range. Today is the darkest.
export function DayBars({ days, todayKey, onOpenDay, average = 0 }: Props) {
	const peak = Math.max(1, ...days.map((day) => day.satang), average);
	const wide = onOpenDay !== undefined;

	return (
		<ol className={wide ? "bars bars--week" : "bars bars--month"} aria-hidden={wide ? undefined : true}>
			{days.map((day) => {
				const height = day.satang === 0 ? 0 : Math.max(4, Math.round((day.satang / peak) * 100));
				const label = `${shortDay(day.date)}, ${day.satang === 0 ? "nothing spent" : formatBaht(day.satang)}`;
				const bar = (
					<>
						{wide && <span className="bar__value">{day.satang === 0 ? "" : Math.round(day.satang / 100).toLocaleString("en-GB")}</span>}
						<span className="bar__track">
							<span className={day.key === todayKey ? "bar bar--today" : "bar"} style={{ height: `${height}%` }} />
							{average > 0 && <span className="bar__avg" style={{ bottom: `${(average / peak) * 100}%` }} />}
						</span>
						{wide && <span className="bar__label">{WEEKDAY_LETTERS[day.date.getDay()]}</span>}
					</>
				);

				return (
					<li className="bars__col" key={day.key}>
						{wide ? (
							<button type="button" className="bars__btn" aria-label={`${label}. Open this day`} onClick={() => onOpenDay(day.date)}>
								{bar}
							</button>
						) : (
							<span className="bars__btn">
								{bar}
							</span>
						)}
					</li>
				);
			})}
		</ol>
	);
}
