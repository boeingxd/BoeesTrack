import type { Slice } from "../lib/stats";

// The list under the ring names and counts every slice, so the ring itself is hidden from screen readers.
// pathLength=100 makes the dash maths plain percent; the 0.6 gap keeps neighbouring slices apart.
export function Donut({ slices }: { slices: Slice[] }) {
	const gap = slices.length > 1 ? 0.6 : 0;
	return (
		<svg className="donut" viewBox="0 0 40 40" aria-hidden="true">
			{slices.map((slice, i) => {
				const length = slice.share * 100;
				const offset = slices.slice(0, i).reduce((sum, s) => sum + s.share * 100, 0);
				return (
					<circle
						key={slice.category}
						data-tone={slice.tone}
						cx="20"
						cy="20"
						r="15.9155"
						pathLength="100"
						strokeDasharray={`${Math.max(0, length - gap)} ${100 - length + gap}`}
						strokeDashoffset={-offset}
					/>
				);
			})}
		</svg>
	);
}
