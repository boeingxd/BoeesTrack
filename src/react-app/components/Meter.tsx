import type { ReactNode } from "react";
import { fillPercent } from "../lib/meter";

type Tone = "ink" | "edge" | "over";

// The bar on its own: ink for the main figure, edge for "the one before", red only when over.
export function MeterTrack({ value, max, tone = "ink" }: { value: number; max: number; tone?: Tone }) {
	return (
		<span className="meter__track" aria-hidden="true">
			<span className={tone === "ink" ? "meter__fill" : `meter__fill meter__fill--${tone}`} style={{ width: `${fillPercent(value, max)}%` }} />
		</span>
	);
}

type Props = {
	name: ReactNode;
	note?: string;
	value: number;
	max: number;
	tone?: Tone;
	amount: string;
};

// One row: name (and a small note) on the left, the bar, the amount on the right.
export function Meter({ name, note, value, max, tone, amount }: Props) {
	return (
		<li className="meter">
			<span className="meter__name">
				{name}
				{note && <span className="meter__note">{note}</span>}
			</span>
			<MeterTrack value={value} max={max} tone={tone} />
			<span className="meter__amount">{amount}</span>
		</li>
	);
}
