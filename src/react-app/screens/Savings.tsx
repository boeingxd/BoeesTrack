import { useMemo, useState } from "react";
import { Figure } from "../components/Figure";
import { Icon } from "../components/Icon";
import { MeterTrack } from "../components/Meter";
import { PotForm } from "../components/PotForm";
import { potTotals } from "../lib/balance";
import { formatBaht } from "../lib/money";
import type { Entry, Pot } from "../lib/types";

type Props = {
	entries: Entry[];
	pots: Pot[];
	today: Date;
	onAddPot: (pot: Pot) => void;
	onEditPot: (oldName: string, pot: Pot) => void;
	onDeletePot: (pot: Pot) => void;
	goneNames: string[];
};

export function Savings({ entries, pots, today, onAddPot, onEditPot, onDeletePot, goneNames }: Props) {
	const totals = useMemo(() => potTotals(entries, pots, today), [entries, pots, today]);
	const saved = totals.reduce((sum, p) => sum + p.total, 0);
	const [adding, setAdding] = useState(false);
	const [editing, setEditing] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	return (
		<main className="home">
			<section className="today" aria-labelledby="saved-label">
				<div className="ledger-head__top">
					<h1 className="month">Savings</h1>
				</div>
				<div className="hero-main">
					<p className="today__label" id="saved-label">
						Saved in total
					</p>
					<p className="today__figure" aria-live="polite">
						<Figure satang={saved} />
					</p>
				</div>
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
									reserved={goneNames}
									initial={pot}
									submitLabel="Save pot"
									onSubmit={(next) => {
										onEditPot(pot.name, next);
										setEditing(null);
										setDeleting(false);
									}}
									onCancel={() => {
										setEditing(null);
										setDeleting(false);
									}}
								>
									{deleting ? (
										<div className="detail__confirm">
											<p className="today__note today__note--warn" role="alert">
												<Icon name="warning" size={18} />
												<span>
													Delete {pot.name}?{" "}
													{total > 0
														? `${formatBaht(total)} goes back to your balance.`
														: total < 0
															? `It is ${formatBaht(-total)} overdrawn, so that comes off your balance.`
															: ""}{" "}
													Its entries stay in History. This can't be undone.
												</span>
											</p>
											<button type="button" className="detail__btn detail__btn--keep" onClick={() => setDeleting(false)}>
												Keep it
											</button>
											<button
												type="button"
												className="detail__btn detail__btn--delete"
												onClick={() => {
													onDeletePot(pot);
													setEditing(null);
													setDeleting(false);
												}}
											>
												Yes, delete
											</button>
										</div>
									) : (
										<button type="button" className="cancel cancel--danger" onClick={() => setDeleting(true)}>
											Delete pot
										</button>
									)}
								</PotForm>
							</li>
						);
					}
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
							<div className="pot__bar" role="img" aria-label={`${pot.name}: ${formatBaht(total)} of ${formatBaht(pot.target)}`}>
								<MeterTrack value={total} max={pot.target} />
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
					reserved={goneNames}
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
