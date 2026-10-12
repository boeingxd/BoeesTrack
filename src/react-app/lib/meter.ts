// How full a bar is, 0 to 100. Anything spent shows at least a sliver; past the max it just stays full.
export function fillPercent(value: number, max: number): number {
	if (value <= 0) return 0;
	if (max <= 0) return 100;
	return Math.min(100, Math.max(2, (value / max) * 100));
}
