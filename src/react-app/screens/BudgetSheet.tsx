import { useState } from "react";
import { Sheet } from "../components/Sheet";
import { Segmented, type Option } from "../components/ViewSwitch";
import { fromBalance } from "../lib/allowance";
import { formatBaht, inputToSatang } from "../lib/money";
import type { BudgetPlan } from "../lib/types";

type SetBy = "amount" | "percent";
type Mode = "auto" | "fixed" | "off";

type Props = {
	plan: BudgetPlan;
	balance: number;
	onClose: () => void;
	onSave: (plan: BudgetPlan) => void;
};

const MODES: Option<Mode>[] = [
	{ value: "auto", label: "Automatic" },
	{ value: "fixed", label: "Fixed" },
	{ value: "off", label: "Off" },
];

const SET_BY: Option<SetBy>[] = [
	{ value: "amount", label: "Amount" },
	{ value: "percent", label: "% of balance" },
];

const EXPLAIN: Record<Mode, string> = {
	auto: "Spreads what is left of the month over the days left. Overspending today lowers tomorrow's.",
	fixed: "The same amount every day. Overspending today does not change tomorrow's.",
	off: "Only the month's budget is tracked, with no daily amount.",
};

const toText = (satang: number) => String(satang / 100);
// Keeps digits and one dot, so "฿1,200" typed or pasted still reads as 1200.
const clean = (text: string) => text.replace(/[^\d.]/g, "");

export function BudgetSheet({ plan, balance, onClose, onSave }: Props) {
	const [setBy, setSetBy] = useState<SetBy>("amount");
	const [percent, setPercent] = useState("");
	const [monthly, setMonthly] = useState(toText(plan.monthly));
	const [mode, setMode] = useState<Mode>(typeof plan.daily === "object" ? "fixed" : plan.daily);
	const [fixed, setFixed] = useState(typeof plan.daily === "object" ? toText(plan.daily.fixed) : "");

	const percentValue = Math.min(100, Number(percent) || 0);
	const monthlySatang = setBy === "percent" ? fromBalance(balance, percentValue) : inputToSatang(clean(monthly));
	const fixedSatang = inputToSatang(clean(fixed));
	const ready = monthlySatang > 0 && (mode !== "fixed" || fixedSatang > 0);

	return (
		<Sheet title="Budget" onClose={onClose}>
			<div className="fields">
				<div className="field">
					<span className="field__label" aria-hidden="true">
						Set by
					</span>
					<div className="field__body">
						<Segmented label="How the month's budget is set" options={SET_BY} value={setBy} onChange={setSetBy} className="scale scale--field" />
					</div>
				</div>
				{setBy === "amount" ? (
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
				) : (
					<div className="field">
						<span className="field__label" aria-hidden="true">
							Percent
						</span>
						<div className="field__body">
							<input
								className="note"
								inputMode="numeric"
								value={percent}
								onChange={(event) => setPercent(event.target.value.replace(/\D/g, ""))}
								aria-label="Percent of your balance, 1 to 100"
								placeholder="1 to 100"
								maxLength={3}
							/>
						</div>
					</div>
				)}
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
			{setBy === "percent" && (
				<p className="review-intro" role="status">
					{balance <= 0
						? "Your balance is \u0e3f0, so there is nothing to take a share of."
						: percentValue > 0
							? `${percentValue}% of your ${formatBaht(balance)} balance = ${formatBaht(monthlySatang)} a month. It stays that amount until you set it again.`
							: `Your balance is ${formatBaht(balance)}.`}
				</p>
			)}
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
		</Sheet>
	);
}
