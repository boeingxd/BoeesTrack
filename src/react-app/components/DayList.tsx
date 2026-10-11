import { dayTitle, timeLabel, type DayGroup } from "../lib/dates";
import { formatBaht } from "../lib/money";
import type { Entry } from "../lib/types";

function lineLabel(entry: Entry): string {
	if (entry.kind === "received") return "Received";
	if (entry.kind === "saved") return entry.pot ? `Saved · ${entry.pot}` : "Saved";
	if (entry.kind === "adjust") return "Adjustment";
	return entry.category ?? "No category";
}

type Props = {
	groups: DayGroup[];
	today: Date;
	justAddedId?: string | null;
};

// One page per day: a small-caps header with the day's spending, then one ruled line per entry.
export function DayList({ groups, today, justAddedId = null }: Props) {
	return (
		<>
			{groups.map((group) => (
				<section className="day" key={group.key} aria-label={dayTitle(group.date, today)}>
					<h2 className="day__head">
						<span>{dayTitle(group.date, today)}</span>
						<span className="day__sum">{formatBaht(group.spent)}</span>
					</h2>
					<ul className="day__lines">
						{group.entries.length === 0 ? (
							<li className="line line--empty">
								<span className="line__body">Nothing spent</span>
							</li>
						) : (
							group.entries.map((entry) => (
								<li className={entry.id === justAddedId ? "line line--new" : "line"} key={entry.id}>
									<time className="line__time">{timeLabel(entry.at)}</time>
									<span className="line__body">
										<span className="line__what">{lineLabel(entry)}</span>
										{entry.kind === "spent" && entry.pot && <span className="line__note">Paid from {entry.pot}</span>}
										{entry.note && <span className="line__note">{entry.note}</span>}
									</span>
									<span className="line__amount">
										{(entry.kind === "received" || (entry.kind === "adjust" && entry.satang > 0)) && "+"}
										{formatBaht(entry.satang)}
									</span>
								</li>
							))
						)}
					</ul>
				</section>
			))}
		</>
	);
}
