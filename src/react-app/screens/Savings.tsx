import { useMemo, useState } from "react";
import { Figure } from "../components/Figure";
import { Icon } from "../components/Icon";
import { PotForm } from "../components/PotForm";
import { ViewSwitch, type View } from "../components/ViewSwitch";
import { potTotals } from "../lib/balance";
import { formatBaht } from "../lib/money";
import type { Entry, Pot } from "../lib/types";

type Props = {
	entries: Entry[];
	pots: Pot[];
	today: Date;
	onView: (view: View) => void;
	onAddPot: (pot: Pot) => void;
	onEditPot: (oldName: string, pot: Pot) => void;
};

export function Savings({ entries, pots, today, onView, onAddPot, onEditPot }: Props) {
	const totals = useMemo(() => potTotals(entries, pots, today), [entries, pots, today]);
	const saved = totals.reduce((sum, p) => sum + p.total, 0);
	const [adding, setAdding] = useState(false);
	const [editing, setEditing] = useState<string | null>(null);

	return (
		<main className="home">
			<header className="topnav">
				<ViewSwitch value="savings" onChange={onView} />
			</header>

			<section className="today" aria-labelledby="saved-label">
				<div className="ledger-head__top">
					<h1 className="month">Savings</h1>
				</div>
				<p className="today__label" id="saved-label">
					Saved in total
				</p>
				<p className="today__figure" aria-live="polite">
					<Figure satang={saved} />
				</p>
			</section>

			<h2 className="money-head">Pots</h2>
			<ul className="pots">
				{totals.length === 0 && <li className="pot pot--empty">No pots yet.</li>}
				{totals.map(({ pot, total, thisMonth }) => {
					if (editing === pot.name) {
						return (
							<li className="pot pot--editing" key={pot.name}>
								<PotForm
									pots={pots}
									initial={pot}
									submitLabel="Save pot"
									onSubmit={(next) => {
										onEditPot(pot.name, next);
										setEditing(null);
									}}
									onCancel={() => setEditing(null)}
								/>
							</li>
						);
					}
					const pct = Math.min(100, Math.max(0, (total / pot.target) * 100));
					return (
						<li className="pot" key={pot.name}>
							<div className="pot__head">
								<p className="pot__row">
									<span className="pot__name">{pot.name}</span>
									<span className={total < 0 ? "pot__sum pot__sum--over" : "pot__sum"}>
										{formatBaht(total)} <span className="pot__of">of {formatBaht(pot.target)}</span>
									</span>
								</p>
								<button type="button" className="icon-btn pot__edit" onClick={() => setEditing(pot.name)} aria-label={`Edit ${pot.name}`}>
									<Icon name="edit" size={18} />
								</button>
							</div>
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
				<PotForm
					pots={pots}
					submitLabel="Add pot"
					onSubmit={(pot) => {
						onAddPot(pot);
						setAdding(false);
					}}
					onCancel={() => setAdding(false)}
				/>
			) : (
				<div className="more-line">
					<button type="button" className="more-line__btn" onClick={() => setAdding(true)}>
						<span>New pot</span>
						<Icon name="plus" size={18} />
					</button>
				</div>
			)}
		</main>
	);
}
