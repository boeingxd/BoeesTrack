import { useState } from "react";
import { ClipMark, Icon } from "../components/Icon";
import { toInputValue } from "../lib/dates";
import { formatBaht, inputToSatang } from "../lib/money";
import { isReady } from "../lib/slipBatch";
import type { Slip } from "../lib/types";

type Props = {
	slips: Slip[];
	categories: string[];
	onChange: (slips: Slip[]) => void;
	onReread: (slip: Slip) => void;
	onClose: () => void;
	onAddByHand: () => void;
	onConfirm: (slips: Slip[]) => void;
};

// The amount is typed as text ("12.5") so the dot behaves; only a whole-baht or two-decimal figure is accepted.
function AmountField({ value, label, onChange }: { value: number | undefined; label: string; onChange: (satang: number | undefined) => void }) {
	const [text, setText] = useState(value ? String(value / 100) : "");
	return (
		<label className="slip__money">
			<span aria-hidden="true">฿</span>
			<input
				className="note"
				inputMode="decimal"
				value={text}
				placeholder="Amount"
				aria-label={label}
				onChange={(event) => {
					const next = event.target.value;
					if (!/^\d{0,7}(\.\d{0,2})?$/.test(next)) return;
					setText(next);
					onChange(inputToSatang(next) || undefined);
				}}
			/>
		</label>
	);
}

export function SlipReview({ slips, categories, onChange, onReread, onClose, onAddByHand, onConfirm }: Props) {
	const update = (id: string, patch: Partial<Slip>) =>
		onChange(slips.map((slip) => (slip.id === id ? { ...slip, ...patch } : slip)));

	const ready = slips.filter(isReady);
	const total = ready.reduce((sum, slip) => sum + (slip.satang ?? 0), 0);
	const uncategorised = ready.filter((slip) => slip.category === null).length;
	const reading = slips.filter((slip) => slip.status === "reading").length;
	const refining = slips.some((slip) => slip.refining);
	const skipped = slips.filter((slip) => slip.status === "unreadable" || slip.status === "duplicate").length;
	const unfinished = slips.filter((slip) => slip.status === "ok" && !slip.removed && !isReady(slip)).length;
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

			<p className="review-intro" aria-live="polite">
				{reading > 0 ? `Reading ${reading} of ${slips.length} slips…` : `${slips.length} picked · ${ready.length} ready${skipped > 0 ? ` · ${skipped} skipped` : ""}.`}{" "}
				{refining && "Checking the names more closely… "}The reader's values are guesses: check each against its picture and fix anything wrong.
				{unfinished > 0 && ` ${unfinished} still need an amount or a time.`}
				{uncategorised > 0 && ` ${uncategorised} without a category.`}
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

						if (slip.status === "reading") {
							return (
								<li className="slip slip--warn" key={slip.id}>
									<span className="slip__clip">
										<ClipMark />
									</span>
									<div className="slip__warning" role="status">
										<p className="warn-title">Reading slip {number}…</p>
										<p className="slip__file">{slip.fileName}</p>
									</div>
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
										<p>{slip.reason ?? "It was left out."} The other slips are not affected.</p>
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
											{slip.duplicateOf ? `Same reference as slip ${slip.duplicateOf}` : "Already in your transactions (same reference)"}, so it
											was skipped. The other slips are not affected.
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
									<img className="slip-photo" src={slip.url} alt={`Slip ${number}, the picture you picked`} />
								</figure>
								<div className="slip__details">
									<AmountField key={slip.id} value={slip.satang} label={`Amount for slip ${number}`} onChange={(satang) => update(slip.id, { satang })} />
									<input
										type="datetime-local"
										className="note slip__field"
										value={slip.at ? toInputValue(slip.at) : ""}
										aria-label={`When slip ${number} was paid`}
										onChange={(event) => {
											const next = new Date(event.target.value);
											update(slip.id, { at: Number.isNaN(next.getTime()) ? undefined : next });
										}}
									/>
									<div className="slip__note">
										<input
											className="note slip__field"
											value={slip.note}
											maxLength={80}
											placeholder="Add a note"
											aria-label={`Note for slip ${number}`}
											onChange={(event) => update(slip.id, { note: event.target.value })}
										/>
										{slip.noteTick ? <span className="slip__flash" key={slip.noteTick} aria-hidden="true" /> : null}
									</div>
									{slip.refining ? (
										<p className="slip__check" role="status">
											<span className="slip__sweep" aria-hidden="true" />
											Checking the name… {Math.min((slip.looks ?? 0) + 1, 3)} of 3
										</p>
									) : (
										slip.nameBox && (
											<p className="slip__check slip__check--done">
												<span>{slip.looks === 3 ? "Name checked" : ""}</span>
												<button type="button" className="icon-btn" aria-label={`Read the name again for slip ${number}`} onClick={() => onReread(slip)}>
													<Icon name="refresh" size={18} />
												</button>
											</p>
										)
									)}
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
									{slip.remembered && <p className="slip__hint">Name and tag filled in from your earlier slip</p>}
									{slip.ref && !slip.ref.startsWith("img") && <p className="slip__ref">Ref {slip.ref}</p>}
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
					{ready.length > 0 ? `Add ${ready.length} ${ready.length === 1 ? "transaction" : "transactions"}` : "Nothing to add"}
				</button>
			</footer>
		</div>
	);
}
