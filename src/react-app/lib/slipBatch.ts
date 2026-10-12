import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "../../worker/wire";
import { readSlip } from "./ocr";
import type { Slip } from "./types";

// A short code made from the picture itself, for a slip whose bank reference could not be read.
// The same screenshot gives the same code, so it is still caught as a duplicate.
export async function fingerprint(file: Blob): Promise<string> {
	const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
	return `img${[...digest.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// shortcut: a picture over 6 MB (a photo of a paper receipt) is refused, not shrunk; resize it in the browser if that comes up.
export function newSlip(file: File, id: string): Slip {
	const reason = !IMAGE_TYPES.includes(file.type) ? "Only JPEG, PNG or WebP pictures work." : file.size > MAX_IMAGE_BYTES ? "That picture is over 6 MB." : null;
	const base = { id, fileName: file.name, note: "", category: null, removed: false };
	return reason ? { ...base, status: "unreadable", reason } : { ...base, status: "reading", file, url: URL.createObjectURL(file) };
}

// Fills a slip in from its picture. What the reader could not find stays empty for you to type; it never guesses a date.
export async function readInto(slip: Slip): Promise<Slip> {
	if (!slip.file) return slip;
	try {
		const fields = await readSlip(slip.file);
		return {
			...slip,
			status: "ok",
			satang: fields.satang ?? undefined,
			at: fields.at ?? undefined,
			note: fields.receiver.slice(0, 80),
			ref: fields.slipRef ?? (await fingerprint(slip.file)),
		};
	} catch {
		return { ...slip, status: "unreadable", reason: "The reader failed on this picture." };
	}
}

// The first slip with a reference stays; later ones with the same reference, or one already saved, are skipped.
// Removed slips don't count, so removing the first lets the second through.
export function flagDuplicates(slips: Slip[], saved: Set<string>): Slip[] {
	const first = new Map<string, number>();
	return slips.map((slip, i) => {
		if (!slip.ref || slip.removed || (slip.status !== "ok" && slip.status !== "duplicate")) return slip;
		const rest = { ...slip, duplicateOf: undefined };
		if (saved.has(slip.ref)) return { ...rest, status: "duplicate" };
		const earlier = first.get(slip.ref);
		if (earlier === undefined) {
			first.set(slip.ref, i);
			return { ...rest, status: "ok" };
		}
		return { ...rest, status: "duplicate", duplicateOf: earlier + 1 };
	});
}

// Ready to add: read, not removed, and the two things an entry cannot do without.
export const isReady = (slip: Slip) => slip.status === "ok" && !slip.removed && !!slip.satang && !!slip.at && !!slip.ref;
