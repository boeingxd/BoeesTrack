import { useRef, useState } from "react";
import { dayDiff, dayMonth, toInputValue, whenLabel } from "../lib/dates";
import { formatBaht } from "../lib/money";
import type { FriendOwes, OpenShare, ShareState } from "../lib/shares";
import type { Entry, Share } from "../lib/types";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";

type LineProps = {
	title: string;
	// Where the part comes from, under the title (the bill on Savings; nothing on the bill's own page).
	detail?: string;
	satang: number;
	state: ShareState;
	today: Date;
	onPaid: () => void;
	onForgive: () => void;
	// Opens the payback (on a settled line) or the bill (on Savings).
	onOpen?: () => void;
};

const onDay = (d: Date, today: Date) => {
	const diff = dayDiff(d, today);
	return diff === 0 ? "today" : diff === 1 ? "yesterday" : dayMonth(d);
};

const stateLabel = (state: ShareState, today: Date) =>
	state.kind === "open" ? "Owes you" : state.kind === "paid" ? `Paid back ${onDay(state.payback.at, today)}` : `Forgiven ${onDay(state.at, today)}`;

// One friend's part as a ruled line. An open part offers "Paid back" and "Forgive"; forgiving asks first,
// because it turns the part into your own spending.
export function OwedLine({ title, detail, satang, state, today, onPaid, onForgive, onOpen }: LineProps) {
	const [confirming, setConfirming] = useState(false);
	const head = (
		<>
			<span className="owed__body">
				<span className="owed__who">{title}</span>
				{detail && <span className="line__note">{detail}</span>}
				{/* On a friend's own sheet every part is open, so "Owes you" would only repeat the heading. */}
				{!(detail && state.kind === "open") && (
					<span className={state.kind === "open" ? "owed__state" : "owed__state owed__state--done"}>{stateLabel(state, today)}</span>
				)}
			</span>
			<span className={state.kind === "open" ? "owed__amount" : "owed__amount owed__amount--done"}>{formatBaht(satang)}</span>
		</>
	);

	return (
		<li className="owed">
			{onOpen ? (
				<button type="button" className="owed__head owed__head--link" onClick={onOpen} aria-label={`${title}, ${formatBaht(satang)}, ${stateLabel(state, today)}. Show details`}>
					{head}
				</button>
			) : (
				<div className="owed__head">{head}</div>
			)}
			{state.kind === "open" &&
				(confirming ? (
					<div className="detail__confirm owed__confirm">
						<p className="today__note today__note--warn" role="alert">
							<Icon name="warning" size={18} />
							<span>Forgive {formatBaht(satang)}? It becomes your own spending today.</span>
						</p>
						<button type="button" className="detail__btn detail__btn--keep" onClick={() => setConfirming(false)}>
							Keep it
						</button>
						<button
							type="button"
							className="detail__btn detail__btn--delete"
							onClick={() => {
								setConfirming(false);
								onForgive();
							}}
						>
							Yes, forgive
						</button>
					</div>
				) : (
					<div className="owed__actions">
						<button type="button" className="owed__paid" onClick={onPaid}>
							<Icon name="check" size={18} />
							Mark paid back
						</button>
						<button type="button" className="cancel" onClick={() => setConfirming(true)}>
							Forgive
						</button>
					</div>
				))}
		</li>
	);
}

type SheetProps = {
	friend: string;
	satang: number;
	onClose: () => void;
	onSave: (at: Date) => void;
};

// "Paid back": the date defaults to now and can be changed, then one tap records the money coming back.
export function PaybackSheet({ friend, satang, onClose, onSave }: SheetProps) {
	const [at, setAt] = useState(() => new Date());
	const whenInput = useRef<HTMLInputElement>(null);
	return (
		<Sheet title="Paid back" onClose={onClose}>
			<p className="payback__lead">
				{friend} paid you <strong>{formatBaht(satang)}</strong>. It goes back into your balance and doesn't count as money received.
			</p>
			<div className="fields fields--pot">
				<div className="field">
					<span className="field__label" aria-hidden="true">
						When
					</span>
					<label className="when field__body">
						<span>{whenLabel(at, new Date())}</span>
						<span className="when__hint">Change</span>
						<input
							ref={whenInput}
							type="datetime-local"
							className="when__input"
							value={toInputValue(at)}
							aria-label="When they paid you back"
							onClick={() => whenInput.current?.showPicker?.()}
							onChange={(event) => {
								const next = new Date(event.target.value);
								if (!Number.isNaN(next.getTime())) setAt(next);
							}}
						/>
					</label>
				</div>
			</div>
			<div className="money-gap">
				<button type="button" className="confirm" onClick={() => onSave(at)}>
					Record {formatBaht(satang)} paid back
				</button>
				<button type="button" className="cancel" onClick={onClose}>
					Cancel
				</button>
			</div>
		</Sheet>
	);
}

type OwedProps = {
	owed: FriendOwes[];
	today: Date;
	onClose: () => void;
	onPayback: (share: Share, at: Date) => void;
	onForgive: (bill: Entry, shareId: string) => void;
	onOpenEntry: (entry: Entry) => void;
};

// Who owes you, opened from Home's balance: one short list per friend, settled with a tap. Settled parts leave the list;
// their record stays on the bill and as "Paid back" lines in History.
export function OwedSheet({ owed, today, onClose, onPayback, onForgive, onOpenEntry }: OwedProps) {
	const [paying, setPaying] = useState<OpenShare | null>(null);
	const total = owed.reduce((sum, f) => sum + f.satang, 0);
	const bills = new Set(owed.flatMap((f) => f.open.map((o) => o.bill.id))).size;

	if (paying) {
		return (
			<PaybackSheet
				friend={paying.share.friend}
				satang={paying.share.satang}
				onClose={() => setPaying(null)}
				onSave={(at) => {
					onPayback(paying.share, at);
					setPaying(null);
				}}
			/>
		);
	}

	return (
		<Sheet title="Friends owe you" onClose={onClose}>
			<p className="payback__lead">
				<strong>{formatBaht(total)}</strong> from {bills} {bills === 1 ? "bill" : "bills"}. It comes back into your balance when they pay you.
			</p>
			{owed.map((f) => (
				<section className="owed-sheet__group" key={f.friend} aria-label={`${f.friend} owes ${formatBaht(f.satang)}`}>
					<h3 className="money-head money-head--split owed-sheet__friend">
						<span>{f.friend}</span>
						<span className="money-head__sum">{formatBaht(f.satang)}</span>
					</h3>
					<ul>
						{f.open.map((item) => (
							<OwedLine
								key={item.share.id}
								title={item.bill.note || item.bill.category || "A bill"}
								detail={`${onDay(item.bill.at, today).replace(/^./, (c) => c.toUpperCase())} · ${formatBaht(item.bill.satang)} in all`}
								satang={item.share.satang}
								state={{ kind: "open" }}
								today={today}
								onPaid={() => setPaying(item)}
								onForgive={() => onForgive(item.bill, item.share.id)}
								onOpen={() => onOpenEntry(item.bill)}
							/>
						))}
					</ul>
				</section>
			))}
		</Sheet>
	);
}
