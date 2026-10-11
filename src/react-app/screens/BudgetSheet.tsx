import { useState } from "react";
import { Icon } from "../components/Icon";
import { Segmented, type Option } from "../components/ViewSwitch";
import { formatBaht, inputToSatang } from "../lib/money";
import type { BudgetPlan } from "../lib/types";

type Mode = "auto" | "fixed" | "off";

type Props = {
	plan: BudgetPlan;
	onClose: () => void;
	onSave: (plan: BudgetPlan) => void;
};

const MODES: Option<Mode>[] = [
	{ value: "auto", label: "Automatic" },
	{ value: "fixed", label: "Fixed" },
	{ value: "off", label: "Off" },
];

const EXPLAIN: Record<Mode, string> = {
	auto: "Spreads what is left of the month over the days left. Overspending today lowers tomorrow's.",
	fixed: "The same amount every day. Overspending today does not change tomorrow's.",
	off: "Only the month's budget is tracked, with no daily amount.",
};

const toText = (satang: number) => String(satang / 100);
// Keeps digits and one dot, so "฿1,200" typed or pasted still reads as 1200.
const clean = (text: string) => text.replace(/[^\d.]/g, "");

export function BudgetSheet({ plan, onClose, onSave }: Props) {
	const [monthly, setMonthly] = useState(toText(plan.monthly));
	const [mode, setMode] = useState<Mode>(typeof plan.daily === "object" ? "fixed" : plan.daily);
	const [fixed, setFixed] = useState(typeof plan.daily === "object" ? toText(plan.daily.fixed) : "");

	const monthlySatang = inputToSatang(clean(monthly));
	const fixedSatang = inputToSatang(clean(fixed));
	const ready = monthlySatang > 0 && (mode !== "fixed" || fixedSatang > 0);

	return (
		<div className="screen screen--sheet">
			<header className="topbar">
				<button type="button" className="icon-btn" onClick={onClose} aria-label="Close without saving">
					<Icon name="close" />
				</button>
				<h1 className="topbar__title">Budget</h1>
				<span className="topbar__spacer" aria-hidden="true" />
			</header>

			<div className="fields">
				<div className="field">
					<span className="field__label" aria-hidden="true">
						Month
					</span>
					<div className="field__body">
						<input
							className="note"
							inputMode="decimal"
							value={monthly}
							onChange={(event) => setMonthly(clean(event.target.value))}
							aria-label="Budget for the month, in baht"
							placeholder="Baht per month"
							maxLength={9}
						/>
					</div>
				</div>
				<div className="field">
					<span className="field__label" aria-hidden="true">
						Daily
					</span>
					<div className="field__body">
						<Segmented label="Daily allowance" options={MODES} value={mode} onChange={setMode} className="scale scale--field" />
					</div>
				</div>
				{mode === "fixed" && (
					<div className="field">
						<span className="field__label" aria-hidden="true">
							Per day
						</span>
						<div className="field__body">
							<input
								className="note"
								inputMode="decimal"
								value={fixed}
								onChange={(event) => setFixed(clean(event.target.value))}
								aria-label="Fixed daily amount, in baht"
								placeholder="Baht per day"
								maxLength={7}
							/>
						</div>
					</div>
				)}
			</div>
			<p className="review-intro">{EXPLAIN[mode]}</p>

			<div className="keys">
				<button
					type="button"
					className="confirm"
					disabled={!ready}
					onClick={() =>
						onSave({ monthly: monthlySatang, daily: mode === "fixed" ? { fixed: fixedSatang } : mode })
					}
				>
					{ready ? `Save ${formatBaht(monthlySatang)} a month` : "Enter the amounts"}
				</button>
			</div>
		</div>
	);
}
