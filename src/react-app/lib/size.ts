// File sizes for people: "0 KB" for nothing, KB under a megabyte, one-decimal MB above.
export function formatSize(bytes: number): string {
	if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
	return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
