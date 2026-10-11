import type { Scale } from "../lib/stats";

export type View = "home" | "stats";

type Option<T extends string> = { value: T; label: string };

function Segmented<T extends string>({
	label,
	options,
	value,
	onChange,
	className,
}: {
	label: string;
	options: Option<T>[];
	value: T;
	onChange: (value: T) => void;
	className: string;
}) {
	return (
		<div className={className} role="radiogroup" aria-label={label}>
			{options.map((item) => (
				<button
					key={item.value}
					type="button"
					role="radio"
					aria-checked={value === item.value}
					className="kind"
					onClick={() => value !== item.value && onChange(item.value)}
				>
					{item.label}
				</button>
			))}
		</div>
	);
}

const VIEWS: Option<View>[] = [
	{ value: "home", label: "Home" },
	{ value: "stats", label: "Insight" },
];

const SCALES: Option<Scale>[] = [
	{ value: "day", label: "Day" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
];

// The page-level row: Home, or Insight (day, week and month all live inside Insight).
export function ViewSwitch({ value, onChange }: { value: View; onChange: (view: View) => void }) {
	return <Segmented label="View" options={VIEWS} value={value} onChange={onChange} className="views" />;
}

export function ScaleSwitch({ scale, onChange }: { scale: Scale; onChange: (scale: Scale) => void }) {
	return <Segmented label="Time scale" options={SCALES} value={scale} onChange={onChange} className="scale" />;
}
