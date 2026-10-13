import type { Box } from "./nameRead";

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
	// Who the slip paid (a shop's Biller ID or a masked account), so the next slip from them can reuse the note and tag.
	payeeKey?: string;
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
	// Where the receiver's name sits on the picture, for the closer second look.
	nameBox?: Box;
	// The note as the reader last set it; if you have changed it since, the reader leaves it alone.
	autoNote?: string;
	payeeKey?: string;
	// Note and tag were filled in from an earlier slip from the same shop.
	remembered?: boolean;
	// The name is being read a second time, more closely.
	refining?: boolean;
	// How many of the three closer looks at the name are done (0 to 3), for the progress line.
	looks?: number;
	// Counts the reader's changes to the note, so the screen can mark each one.
	noteTick?: number;
	category: string | null;
	removed: boolean;
};
