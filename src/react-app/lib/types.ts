// "adjust" is a signed correction made when the app is checked against the bank balance.
export type Kind = "spent" | "received" | "saved" | "adjust";

export type Entry = {
	id: string;
	kind: Kind;
	satang: number;
	at: Date;
	category: string | null;
	note: string;
	slipRef?: string;
	// Required on "saved" (the pot it goes into); on "spent" it means the money came out of that pot.
	pot?: string;
};

export type Pot = { name: string; target: number; monthly: number };

export type BudgetPlan = { monthly: number; daily: "auto" | "off" | { fixed: number } };

export type Slip = {
	id: string;
	fileName: string;
	status: "ok" | "unreadable" | "duplicate";
	satang?: number;
	at?: Date;
	ref?: string;
	duplicateOf?: number;
	category: string | null;
	removed: boolean;
};
