import type { ReactNode } from "react";
import type { Slice } from "../lib/stats";

type Props = {
	slices: Slice[];
	picked: Slice | null;
	onPick: (slice: Slice | null) => void;
	// The centre readout for the picked slice, drawn over the hole.
	children?: ReactNode;
};

// pathLength=100 makes the dash maths plain percent; the 0.6 gap keeps neighbouring slices apart.
// Each slice is a button; a wider invisible circle under it gives a finger more ring to land on.
export function Donut({ slices, picked, onPick, children }: Props) {
	const gap = slices.length > 1 ? 0.6 : 0;
	return (
		<div className="donut">
			<svg className={picked ? "donut__ring donut__ring--picking" : "donut__ring"} viewBox="0 0 40 40">
				{slices.map((slice, i) => {
					const length = slice.share * 100;
					const offset = slices.slice(0, i).reduce((sum, s) => sum + s.share * 100, 0);
					const on = picked?.tone === slice.tone;
					const pick = () => onPick(on ? null : slice);
					const circle = { cx: 20, cy: 20, r: 15.9155, pathLength: 100, strokeDashoffset: -offset };
					return (
						<g
							key={slice.category}
							role="button"
							tabIndex={0}
							aria-pressed={on}
							aria-label={`${slice.category}, ${Math.round(slice.share * 100)}%`}
							className={on ? "donut__slice is-picked" : "donut__slice"}
							onClick={pick}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									pick();
								}
							}}
						>
							<circle {...circle} className="donut__hit" strokeDasharray={`${length} ${100 - length}`} />
							<circle {...circle} className="donut__fill" data-tone={slice.tone} strokeDasharray={`${Math.max(0, length - gap)} ${100 - length + gap}`} />
						</g>
					);
				})}
			</svg>
			{children}
		</div>
	);
}
