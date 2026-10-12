import { useState } from "react";
import { Icon } from "../components/Icon";
import { dayTitle, timeLabel } from "../lib/dates";
import { formatBaht } from "../lib/money";
import { NO_CATEGORY } from "../lib/stats";
import type { Entry } from "../lib/types";

type Props = {
	entry: Entry;
	today: Date;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
};

const KIND_LABEL: Record<Entry["kind"], string> = {
	spent: "Spent",
	received: "Received",
	saved: "Saved",
	adjust: "Adjustment",
};

// One entry in full. Adjustments (from a bank check-in) and entries made from a slip can be deleted but not edited, because their amount is not a typo to fix.
export function EntryDetail({ entry, today, onClose, onEdit, onDelete }: Props) {
	const [confirming, setConfirming] = useState(false);
	const editable = entry.kind !== "adjust" && !entry.slipRef;
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
				{editable ? (
					<button type="button" className="text-btn" onClick={onEdit}>
						Edit
					</button>
				) : (
					<span className="topbar__spacer" aria-hidden="true" />
				)}
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

			{confirming ? (
				<div className="detail__confirm">
					<p className="today__note today__note--warn" role="alert">
						<Icon name="warning" size={18} />
						<span>Delete this entry? This can't be undone.</span>
					</p>
					<button type="button" className="text-btn" onClick={() => setConfirming(false)}>
						Keep it
					</button>
					<button type="button" className="text-btn" onClick={onDelete}>
						Yes, delete
					</button>
				</div>
			) : (
				<button type="button" className="text-btn detail__delete" onClick={() => setConfirming(true)}>
					Delete entry
				</button>
			)}
		</div>
	);
}
