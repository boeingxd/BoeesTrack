import { useState } from "react";
import { inputToSatang } from "../lib/money";
import type { Pot } from "../lib/types";

type Props = {
	pots: Pot[];
	reserved?: string[];
	children?: React.ReactNode;
	initial?: Pot;
	submitLabel: string;
	onSubmit: (pot: Pot) => void;
	onCancel: () => void;
};

const clean = (text: string) => text.replace(/[^\d.]/g, "");
const toText = (satang: number) => (satang > 0 ? String(satang / 100) : "");

// Name, target and monthly amount for a savings pot; used to make a pot (Savings, Add) and to edit one.
export function PotForm({ pots, reserved = [], children, initial, submitLabel, onSubmit, onCancel }: Props) {
	const [name, setName] = useState(initial?.name ?? "");
	const [target, setTarget] = useState(initial ? toText(initial.target) : "");
	const [monthly, setMonthly] = useState(initial ? toText(initial.monthly) : "");

	// "Balance" is the other choice under "Paid from", so a pot cannot take that name; nor can the name of a pot that was deleted.
	const taken = [...pots.map((p) => p.name).filter((n) => n !== initial?.name), ...reserved, "Balance"];
	const ready = name.trim() !== "" && inputToSatang(clean(target)) > 0 && !taken.some((n) => n.toLowerCase() === name.trim().toLowerCase());

	const rows = [
		{ label: "Name", value: name, set: setName, placeholder: "Pot name", numeric: false },
		{ label: "Target", value: target, set: setTarget, placeholder: "Baht to reach", numeric: true },
		{ label: "Monthly", value: monthly, set: setMonthly, placeholder: "Baht each month (optional)", numeric: true },
	];

	return (
		<>
			<div className="fields fields--pot">
				{rows.map((f) => (
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
			</div>
			<div className="money-gap">
				<button
					type="button"
					className="confirm"
					disabled={!ready}
					onClick={() => onSubmit({ name: name.trim(), target: inputToSatang(clean(target)), monthly: inputToSatang(clean(monthly)) })}
				>
					{submitLabel}
				</button>
				<button type="button" className="cancel" onClick={onCancel}>
					Cancel
				</button>
				{children}
			</div>
		</>
	);
}
