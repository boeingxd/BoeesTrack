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
	// True when the slip's picture is stored. Set by the server, never sent back.
	hasImage?: boolean;
};

export type Pot = { name: string; target: number; monthly: number };

export type BudgetPlan = { monthly: number; daily: "auto" | "off" | { fixed: number } };

export type Slip = {
	id: string;
	fileName: string;
	status: "reading" | "ok" | "unreadable" | "duplicate";
	satang?: number;
	at?: Date;
	note: string;
	ref?: string;
	// Why a slip was left out ("unreadable" only).
	reason?: string;
	// The picture is kept to upload on confirm; url is its preview and is released when the batch ends.
	file?: File;
	url?: string;
	// Position in this batch of the slip it repeats; missing on a duplicate means it is already saved.
	duplicateOf?: number;
	category: string | null;
	removed: boolean;
};
