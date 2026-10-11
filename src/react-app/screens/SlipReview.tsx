import { ClipMark, Icon } from "../components/Icon";
import { shortDay, timeLabel } from "../lib/dates";
import { formatBaht } from "../lib/money";
import type { Slip } from "../lib/types";

type Props = {
	slips: Slip[];
	categories: string[];
	onChange: (slips: Slip[]) => void;
	onClose: () => void;
	onAddByHand: () => void;
	onConfirm: (slips: Slip[]) => void;
};

// Stand-in for the slip image: ruled bars, drawn in code, never a real slip.
function SlipThumb() {
	return (
		<div className="slip-thumb" role="img" aria-label="Slip image (sample placeholder)">
			<span />
			<span />
			<span />
			<span />
			<span />
			<span />
		</div>
	);
}

export function SlipReview({ slips, categories, onChange, onClose, onAddByHand, onConfirm }: Props) {
	const update = (id: string, patch: Partial<Slip>) =>
		onChange(slips.map((slip) => (slip.id === id ? { ...slip, ...patch } : slip)));

	const ready = slips.filter((slip) => slip.status === "ok" && !slip.removed);
	const total = ready.reduce((sum, slip) => sum + (slip.satang ?? 0), 0);
	const uncategorised = ready.filter((slip) => slip.category === null).length;
	const skipped = slips.filter((slip) => slip.status !== "ok").length;
	const noun = ready.length === 1 ? "slip" : "slips";

	return (
		<div className="screen screen--sheet">
			<header className="topbar">
				<button type="button" className="icon-btn" onClick={onClose} aria-label="Back without adding">
					<Icon name="back" />
				</button>
				<h1 className="topbar__title">Review slips</h1>
				<span className="topbar__spacer" aria-hidden="true" />
			</header>

			<p className="review-intro">
				{slips.length} uploaded · {ready.length} readable{skipped > 0 && ` · ${skipped} skipped`}. Check each value
				against its slip, and choose a category.{uncategorised > 0 && ` ${uncategorised} still without one.`}
			</p>

			<div className="review-sheet">
				<ol className="slips">
					{slips.map((slip, index) => {
						const number = index + 1;

						if (slip.removed) {
							return (
								<li className="slip slip--removed" key={slip.id}>
									<span>Slip {number} removed from this batch.</span>
									<button type="button" className="text-btn" onClick={() => update(slip.id, { removed: false })}>
										Put back
									</button>
								</li>
							);
						}

						if (slip.status === "unreadable") {
							return (
								<li className="slip slip--warn" key={slip.id}>
									<span className="slip__clip">
										<ClipMark />
									</span>
									<div className="slip__warning" role="status">
										<p className="warn-title">
											<Icon name="warning" size={18} />
											Couldn't read slip {number}
										</p>
										<p className="slip__file">{slip.fileName}</p>
										<p>It was left out. The other slips are not affected.</p>
										<button type="button" className="text-btn" onClick={onAddByHand}>
											Add it by hand
										</button>
									</div>
								</li>
							);
						}

						if (slip.status === "duplicate") {
							return (
								<li className="slip slip--warn" key={slip.id}>
									<span className="slip__clip">
										<ClipMark />
									</span>
									<div className="slip__warning" role="status">
										<p className="warn-title">
											<Icon name="warning" size={18} />
											Slip {number} is a duplicate
										</p>
										<p className="slip__file">{slip.fileName}</p>
										<p>
											Same reference as slip {slip.duplicateOf}, so it was skipped. The other slips are not
											affected.
										</p>
									</div>
								</li>
							);
						}

						return (
							<li className="slip" key={slip.id}>
								<span className="slip__clip">
									<ClipMark />
								</span>
								<figure className="slip__figure">
									<SlipThumb />
									<figcaption className="slip__value">{formatBaht(slip.satang ?? 0)}</figcaption>
								</figure>
								<div className="slip__details">
									<p className="slip__when">{slip.at && `${shortDay(slip.at)} · ${timeLabel(slip.at)}`}</p>
									<p className="slip__ref">Ref {slip.ref}</p>
									<label className="select">
										<select
											className="select__input"
											value={slip.category ?? ""}
											aria-label={`Category for slip ${number}`}
											onChange={(event) => update(slip.id, { category: event.target.value || null })}
										>
											<option value="">Choose a category</option>
											{categories.map((name) => (
												<option key={name} value={name}>
													{name}
												</option>
											))}
										</select>
										<Icon name="down" size={16} />
									</label>
								</div>
								<button
									type="button"
									className="icon-btn slip__x"
									aria-label={`Remove slip ${number} from this batch`}
									onClick={() => update(slip.id, { removed: true })}
								>
									<Icon name="close" />
								</button>
							</li>
						);
					})}
				</ol>

				<div className="review-end">
					<button type="button" className="text-btn text-btn--center" onClick={onClose}>
						Discard this batch
					</button>
				</div>
			</div>

			<footer className="batch-bar">
				<p className="batch-bar__sum" aria-live="polite">
					{ready.length > 0 ? (
						<>
							These {ready.length} {noun} add up to <strong>{formatBaht(total)}</strong>. Does that look right?
						</>
					) : (
						"No readable slips left in this batch."
					)}
				</p>
				<button type="button" className="confirm" disabled={ready.length === 0} onClick={() => onConfirm(ready)}>
					{ready.length > 0 ? `Add ${ready.length} ${ready.length === 1 ? "entry" : "entries"}` : "Nothing to add"}
				</button>
			</footer>
		</div>
	);
}
