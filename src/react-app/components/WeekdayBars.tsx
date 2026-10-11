import { formatBaht } from "../lib/money";

type Props = {
	// Monday first, whole-baht averages in satang; the priciest weekday is drawn in solid ink.
	days: { weekday: number; satang: number }[];
};

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WeekdayBars({ days }: Props) {
	const peak = Math.max(...days.map((day) => day.satang));
	if (peak <= 0) return null;
	const top = days.find((day) => day.satang === peak)!;

	return (
		<figure className="weekday">
			<figcaption className="weekday__cap">By weekday, on average</figcaption>
			<ol className="bars bars--weekday" aria-hidden="true">
				{days.map((day) => (
					<li className="bars__col" key={day.weekday}>
						<span className="bars__btn">
							<span className="bar__track">
								<span
									className={day === top ? "bar bar--top" : "bar"}
									style={{ height: `${day.satang === 0 ? 0 : Math.max(4, Math.round((day.satang / peak) * 100))}%` }}
								/>
							</span>
							<span className="bar__label">{LETTERS[day.weekday]}</span>
						</span>
					</li>
				))}
			</ol>
			<p className="weekday__top">
				Priciest: {NAMES[top.weekday]} · {formatBaht(top.satang)}
			</p>
		</figure>
	);
}
