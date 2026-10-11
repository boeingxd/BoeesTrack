import { Icon } from "../components/Icon";
import { dayTitle, timeLabel } from "../lib/dates";
import { formatBaht } from "../lib/money";
import { NO_CATEGORY } from "../lib/stats";
import type { Entry } from "../lib/types";

type Props = {
	entry: Entry;
	today: Date;
	onClose: () => void;
};

const KIND_LABEL: Record<Entry["kind"], string> = {
	spent: "Spent",
	received: "Received",
	saved: "Saved",
	adjust: "Adjustment",
};

// One entry in full. Read-only for now: editing and deleting are not built yet.
export function EntryDetail({ entry, today, onClose }: Props) {
	const rows: [string, string | null][] = [
		["Kind", KIND_LABEL[entry.kind]],
		["When", `${dayTitle(entry.at, today)} · ${timeLabel(entry.at)}`],
		["Tag", entry.kind === "spent" ? (entry.category ?? NO_CATEGORY) : null],
		["Pot", entry.pot ? (entry.kind === "spent" ? `Paid from ${entry.pot}` : entry.pot) : null],
		["Note", entry.note || null],
		["Slip", entry.slipRef ?? null],
	];

	return (
		<div className="screen screen--sheet">
			<header className="topbar">
				<button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
					<Icon name="close" />
				</button>
				<h1 className="topbar__title">Entry</h1>
				<span className="topbar__spacer" aria-hidden="true" />
			</header>

			<p className="today__figure detail__amount">
				{entry.kind === "received" || (entry.kind === "adjust" && entry.satang > 0) ? "+" : ""}
				{formatBaht(entry.satang)}
			</p>

			<div className="fields">
				{rows.map(
					([label, value]) =>
						value !== null && (
							<div className="field" key={label}>
								<span className="field__label">{label}</span>
								<div className="field__body">
									<p>{value}</p>
								</div>
							</div>
						),
				)}
			</div>
		</div>
	);
}
