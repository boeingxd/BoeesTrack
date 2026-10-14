import { useState } from "react";
import { Icon } from "../components/Icon";
import { OwedLine, PaybackSheet } from "../components/Owed";
import { dayTitle, timeLabel } from "../lib/dates";
import { formatBaht } from "../lib/money";
import { billFor, ownPart, shareState } from "../lib/shares";
import { NO_CATEGORY } from "../lib/stats";
import type { Entry, Share } from "../lib/types";

type Props = {
	entry: Entry;
	// Everything, to show how each friend's part stands and which bill a payback settles.
	entries: Entry[];
	today: Date;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
	onRemovePicture: () => void;
	onPayback: (share: Share, at: Date) => void;
	onForgive: (shareId: string) => void;
	onOpenEntry: (entry: Entry) => void;
};

const KIND_LABEL: Record<Entry["kind"], string> = {
	spent: "Spent",
	received: "Received",
	saved: "Saved",
	adjust: "Adjustment",
};

// One entry in full. Adjustments (from a bank check-in) can be deleted but not edited, because their amount is not a typo to fix. Slip entries can be edited; the slip reference and picture stay with them.
// A payback can only be deleted too: its amount is the friend's part, and deleting it means they owe it again.
export function EntryDetail({ entry, entries, today, onClose, onEdit, onDelete, onRemovePicture, onPayback, onForgive, onOpenEntry }: Props) {
	const [confirming, setConfirming] = useState<"entry" | "picture" | null>(null);
	const [paying, setPaying] = useState<Share | null>(null);
	const picture = entry.slipRef && entry.hasImage ? `/api/slips/${entry.slipRef}` : null;
	const settles = entry.share ? billFor(entry, entries) : null;
	const editable = entry.kind !== "adjust" && !entry.share;
	const shares = entry.kind === "spent" ? (entry.shares ?? []) : [];
	const repaid = shares.filter((p) => shareState(p, entries).kind === "paid").length;
	const rows: [string, string | null][] = [
		["Kind", entry.share ? "Paid back" : KIND_LABEL[entry.kind]],
		["Yours", shares.length > 0 ? formatBaht(ownPart(entry)) : null],
		["When", `${dayTitle(entry.at, today)} · ${timeLabel(entry.at)}`],
		["Tag", entry.kind === "spent" ? (entry.category ?? NO_CATEGORY) : null],
		["Pot", entry.pot ? (entry.kind === "spent" ? `Paid from ${entry.pot}` : entry.pot) : null],
		// A payback's note is the friend's name, which "For" already says.
		["Note", settles ? null : entry.note || null],
		["Slip", entry.slipRef ?? null],
	];

	return (
		<div className="screen screen--sheet">
			<header className="topbar">
				<button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
					<Icon name="close" />
				</button>
				<h1 className="topbar__title">Transaction</h1>
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
				{settles && (
					<div className="field">
						<span className="field__label">For</span>
						<div className="field__body">
							<button type="button" className="text-btn detail__link" onClick={() => onOpenEntry(settles.bill)}>
								{settles.share.friend}'s part of {settles.bill.note || settles.bill.category || "a bill"}, {formatBaht(settles.bill.satang)}
							</button>
						</div>
					</div>
				)}
			</div>

			{shares.length > 0 && (
				<section aria-labelledby="split-title">
					<h2 className="money-head" id="split-title">
						Friends' parts
					</h2>
					<ul>
						{shares.map((share) => {
							const state = shareState(share, entries);
							return (
								<OwedLine
									key={share.id}
									title={share.friend}
									satang={share.satang}
									state={state}
									today={today}
									onPaid={() => setPaying(share)}
									onForgive={() => onForgive(share.id)}
									onOpen={state.kind === "paid" ? () => onOpenEntry(state.payback) : undefined}
								/>
							);
						})}
					</ul>
				</section>
			)}

			{paying && (
				<PaybackSheet
					friend={paying.friend}
					satang={paying.satang}
					onClose={() => setPaying(null)}
					onSave={(at) => {
						onPayback(paying, at);
						setPaying(null);
					}}
				/>
			)}

			{picture && (
				<a className="detail__photo" href={picture} target="_blank" rel="noreferrer" aria-label="Open the slip picture full size">
					<img src={picture} alt="The slip you saved with this transaction" />
				</a>
			)}

			{confirming ? (
				<div className="detail__confirm">
					<p className="today__note today__note--warn" role="alert">
						<Icon name="warning" size={18} />
						<span>
							{confirming === "picture"
								? "Remove the picture? The transaction stays. This can't be undone."
								: settles
									? `Delete this payback? ${settles.share.friend} will owe ${formatBaht(settles.share.satang)} again.`
									: repaid > 0
										? `Delete this transaction? Its ${repaid === 1 ? "payback stays" : "paybacks stay"} and will count as money received. This can't be undone.`
										: "Delete this transaction? This can't be undone."}
						</span>
					</p>
					<button type="button" className="detail__btn detail__btn--keep" onClick={() => setConfirming(null)}>
						Keep it
					</button>
					<button
						type="button"
						className="detail__btn detail__btn--delete"
						onClick={() => {
							setConfirming(null);
							if (confirming === "entry") onDelete();
							else onRemovePicture();
						}}
					>
						{confirming === "entry" ? "Yes, delete" : "Yes, remove"}
					</button>
				</div>
			) : (
				<>
					{picture && (
						<button type="button" className="detail__btn detail__btn--outline detail__delete" onClick={() => setConfirming("picture")}>
							Remove picture
						</button>
					)}
					<button type="button" className="detail__btn detail__btn--outline detail__delete" onClick={() => setConfirming("entry")}>
						Delete transaction
					</button>
				</>
			)}
		</div>
	);
}
