export type Kind = "spent" | "received" | "saved";

export type Entry = {
	id: string;
	kind: Kind;
	satang: number;
	at: Date;
	category: string | null;
	note: string;
	slipRef?: string;
};

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
