import { bahtParts } from "../lib/money";

// A baht amount with the currency symbol set small, used for the big figures.
export function Figure({ satang }: { satang: number }) {
	const { sign, digits } = bahtParts(satang);
	return (
		<>
			{sign}
			<span className="figure__cur">฿</span>
			{digits}
		</>
	);
}
