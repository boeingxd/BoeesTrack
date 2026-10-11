import { useMemo, useState } from "react";
import { Figure } from "../components/Figure";
import { Icon } from "../components/Icon";
import { balance, potTotals } from "../lib/balance";
import { formatBaht, inputToSatang } from "../lib/money";
import type { Entry, Pot } from "../lib/types";

type Props = {
	entries: Entry[];
	pots: Pot[];
	today: Date;
	onClose: () => void;
	onCheckIn: (bankSatang: number) => void;
	onAddPot: (pot: Pot) => void;
};

const clean = (text: string) => text.replace(/[^\d.]/g, "");

export function Money({ entries, pots, today, onClose, onCheckIn, onAddPot }: Props) {
	const held = useMemo(() => balance(entries), [entries]);
	const totals = useMemo(() => potTotals(entries, pots, today), [entries, pots, today]);
	const [bank, setBank] = useState("");
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState("");
	const [target, setTarget] = useState("");
	const [monthly, setMonthly] = useState("");

	const bankSatang = inputToSatang(clean(bank));
	const gap = bank === "" ? 0 : bankSatang - held;
	const potReady = name.trim() !== "" && inputToSatang(clean(target)) > 0 && ![...pots.map((p) => p.name), "Balance"].some((n) => n.toLowerCase() === name.trim().toLowerCase()); // "Balance" is the other choice under "Paid from"

	function checkIn() {
		onCheckIn(bankSatang);
		setBank("");
	}

	function addPot() {
		onAddPot({ name: name.trim(), target: inputToSatang(clean(target)), monthly: inputToSatang(clean(monthly)) });
		setName("");
		setTarget("");
		setMonthly("");
		setAdding(false);
	}

	return (
		<div className="screen screen--sheet">
			<header className="topbar">
				<button type="button" className="icon-btn" onClick={onClose} aria-label="Back">
					<Icon name="back" />
				</button>
				<h1 className="topbar__title">Money</h1>
				<span className="topbar__spacer" aria-hidden="true" />
			</header>

			<section className="today" aria-labelledby="balance-label">
				<p className="today__label" id="balance-label">
					Balance
				</p>
				<p className="today__figure" aria-live="polite">
					<Figure satang={held} />
				</p>
				<p className="today__note">Received money adds to it. Spending and money set aside take away.</p>
			</section>

			<div className="fields">
				<div className="field">
					<span className="field__label" aria-hidden="true">
						Bank says
					</span>
					<div className="field__body">
						<input
							className="note"
							inputMode="decimal"
							value={bank}
							onChange={(event) => setBank(clean(event.target.value))}
							aria-label="Your real bank balance, in baht"
							placeholder="Check against your bank"
							maxLength={10}
						/>
					</div>
				</div>
			</div>
			{bank !== "" && (
				<div className="money-gap">
					<p className="today__note">
						{gap === 0
							? "Matches the app, nothing to add."
							: `The app is ${formatBaht(Math.abs(gap))} ${gap < 0 ? "above" : "below"} your bank. This adds a ${gap > 0 ? "+" : ""}${formatBaht(gap)} adjustment.`}
					</p>
					<button type="button" className="confirm" disabled={gap === 0} onClick={checkIn}>
						Add adjustment
					</button>
				</div>
			)}

			<h2 className="money-head">Savings pots</h2>
			<ul className="pots">
				{totals.length === 0 && <li className="pot pot--empty">No pots yet.</li>}
				{totals.map(({ pot, total, thisMonth }) => {
					const pct = Math.min(100, Math.max(0, (total / pot.target) * 100));
					return (
						<li className="pot" key={pot.name}>
							<p className="pot__row">
								<span className="pot__name">{pot.name}</span>
								<span className={total < 0 ? "pot__sum pot__sum--over" : "pot__sum"}>
									{formatBaht(total)} <span className="pot__of">of {formatBaht(pot.target)}</span>
								</span>
							</p>
							<div className="budget-bar" role="img" aria-label={`${pot.name}: ${formatBaht(total)} of ${formatBaht(pot.target)}`}>
								<span className="budget-bar__today" style={{ width: `${pct}%` }} />
							</div>
							{pot.monthly > 0 && (
								<p className="pot__month">
									{formatBaht(thisMonth)} of {formatBaht(pot.monthly)} this month
								</p>
							)}
						</li>
					);
				})}
			</ul>

			{adding ? (
				<div className="fields fields--pot">
					{[
						{ label: "Name", value: name, set: setName, placeholder: "Pot name", numeric: false },
						{ label: "Target", value: target, set: setTarget, placeholder: "Baht to reach", numeric: true },
						{ label: "Monthly", value: monthly, set: setMonthly, placeholder: "Baht each month (optional)", numeric: true },
					].map((f) => (
						<div className="field" key={f.label}>
							<span className="field__label" aria-hidden="true">
								{f.label}
							</span>
							<div className="field__body">
								<input
									className="note"
									inputMode={f.numeric ? "decimal" : "text"}
									value={f.value}
									onChange={(event) => f.set(f.numeric ? clean(event.target.value) : event.target.value)}
									aria-label={f.placeholder}
									placeholder={f.placeholder}
									maxLength={f.numeric ? 9 : 24}
								/>
							</div>
						</div>
					))}
					<div className="money-gap">
						<button type="button" className="confirm" disabled={!potReady} onClick={addPot}>
							Add pot
						</button>
					</div>
				</div>
			) : (
				<div className="more-line">
					<button type="button" className="more-line__btn" onClick={() => setAdding(true)}>
						<span>New pot</span>
						<Icon name="plus" size={18} />
					</button>
				</div>
			)}
		</div>
	);
}
