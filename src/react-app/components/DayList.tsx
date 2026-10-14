import { dayTitle, timeLabel, type DayGroup } from "../lib/dates";
import { formatBaht } from "../lib/money";
import { ownPart } from "../lib/shares";
import type { Entry } from "../lib/types";

function lineLabel(entry: Entry): string {
	if (entry.kind === "received") return entry.share ? "Paid back" : "Received";
	if (entry.kind === "saved") return entry.pot ? `Saved · ${entry.pot}` : "Saved";
	if (entry.kind === "adjust") return "Adjustment";
	return entry.category ?? "No category";
}

type LineProps = { entry: Entry; when: string; isNew?: boolean; onOpen: (entry: Entry) => void };

// One ruled line; `when` is the time inside a day page, or the date in a flat sorted list.
export function EntryLine({ entry, when, isNew = false, onOpen }: LineProps) {
	return (
		<li>
			<button
				type="button"
				className={isNew ? "line line--link line--new" : "line line--link"}
				aria-label={`${lineLabel(entry)}, ${formatBaht(entry.satang)}. Show details`}
				onClick={() => onOpen(entry)}
			>
				<time className="line__time">{when}</time>
				<span className="line__body">
					<span className="line__what">{lineLabel(entry)}</span>
					{entry.kind === "spent" && entry.pot && <span className="line__note">Paid from {entry.pot}</span>}
					{entry.note && <span className="line__note">{entry.note}</span>}
					{entry.kind === "spent" && entry.shares?.length ? <span className="line__note">Your share {formatBaht(ownPart(entry))}</span> : null}
				</span>
				<span className="line__amount">
					{(entry.kind === "received" || (entry.kind === "adjust" && entry.satang > 0)) && "+"}
					{formatBaht(entry.satang)}
				</span>
			</button>
		</li>
	);
}

type Props = {
	groups: DayGroup[];
	today: Date;
	justAddedId?: string | null;
	// Leave out the day header when the screen already shows the date and the total (Insight's Day view).
	bare?: boolean;
	onOpenEntry: (entry: Entry) => void;
};

// One page per day: a small-caps header with the day's spending, then one ruled line per entry.
export function DayList({ groups, today, justAddedId = null, bare = false, onOpenEntry }: Props) {
	return (
		<>
			{groups.map((group) => (
				<section className="day" key={group.key} aria-label={dayTitle(group.date, today)}>
					{!bare && (
						<h2 className="day__head">
							<span>{dayTitle(group.date, today)}</span>
							<span className="day__sum">{formatBaht(group.spent)}</span>
						</h2>
					)}
					<ul className="day__lines">
						{group.entries.length === 0 ? (
							<li className="line line--empty">
								<span className="line__body">Nothing spent</span>
							</li>
						) : (
							group.entries.map((entry) => (
								<EntryLine key={entry.id} entry={entry} when={timeLabel(entry.at)} isNew={entry.id === justAddedId} onOpen={onOpenEntry} />
							))
						)}
					</ul>
				</section>
			))}
		</>
	);
}
