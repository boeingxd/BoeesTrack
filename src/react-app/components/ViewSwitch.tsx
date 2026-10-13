import type { Scale } from "../lib/stats";
import { Icon, type IconName } from "./Icon";

export type View = "home" | "stats" | "history" | "savings";

export type Option<T extends string> = { value: T; label: string; icon?: IconName };

export function Segmented<T extends string>({
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
					{item.icon && <Icon name={item.icon} size={22} />}
					{item.icon ? <span>{item.label}</span> : item.label}
				</button>
			))}
		</div>
	);
}

const VIEWS: Option<View>[] = [
	{ value: "home", label: "Home", icon: "home" },
	{ value: "stats", label: "Insight", icon: "insight" },
	{ value: "history", label: "History", icon: "history" },
	{ value: "savings", label: "Savings", icon: "savings" },
];

const SCALES: Option<Scale>[] = [
	{ value: "day", label: "Day" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
];

// The bottom bar on the four main screens: Home, Insight (day, week and month live inside it), History and Savings, with Add beside it as its own button.
export function TabBar({ value, onChange, onAdd }: { value: View; onChange: (view: View) => void; onAdd: () => void }) {
	return (
		<nav className="tabbar" aria-label="Main">
			<Segmented label="View" options={VIEWS} value={value} onChange={onChange} className="views" />
			<button type="button" className="tabbar__add" onClick={onAdd} aria-label="Add">
				<Icon name="plus" />
				<span className="tabbar__label">Add</span>
			</button>
		</nav>
	);
}

export function ScaleSwitch({ scale, onChange }: { scale: Scale; onChange: (scale: Scale) => void }) {
	return <Segmented label="Time scale" options={SCALES} value={scale} onChange={onChange} className="scale" />;
}
