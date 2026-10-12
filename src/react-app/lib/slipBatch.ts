import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "../../worker/wire";
import { pickName, type Names } from "./nameRead";
import { cropName, readFull, readName, type NameModel } from "./ocr";
import type { Entry, Slip } from "./types";

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

// First look at a slip: amount, time, reference and a first guess at the name. What the reader could not find stays
// empty for you to type; it never guesses a date.
export async function readInto(slip: Slip): Promise<Slip> {
	if (!slip.file) return slip;
	try {
		const { fields, box } = await readFull(slip.file);
		const note = fields.receiver.slice(0, 80);
		return {
			...slip,
			status: "ok",
			satang: fields.satang ?? undefined,
			at: fields.at ?? undefined,
			note,
			autoNote: note,
			ref: fields.slipRef ?? (await fingerprint(slip.file)),
			payeeKey: fields.payeeKey ?? undefined,
			nameBox: box ?? undefined,
		};
	} catch {
		return { ...slip, status: "unreadable", reason: "The reader failed on this picture." };
	}
}

// A shop or person you have paid from a slip before: reuse the note and tag you gave the newest time.
export function rememberPayee(slip: Slip, entries: Entry[]): Slip {
	if (!slip.payeeKey) return slip;
	const past = entries.filter((e) => e.payeeKey === slip.payeeKey).sort((a, b) => b.at.getTime() - a.at.getTime())[0];
	return past ? { ...slip, note: past.note, autoNote: past.note, category: past.category, remembered: true } : slip;
}

const MODELS: [NameModel, keyof Names][] = [
	["tha+eng", "both"],
	["tha", "thai"],
	["eng", "eng"],
];

type Update = (id: string, change: (slip: Slip) => Slip) => void;

// Reads a batch in two rounds. Round one fills in every slip's fields. Round two takes a closer look at each name, one
// model at a time (switching model is the slow part), and improves the note after each look unless you have changed it.
export async function readBatch(batch: Slip[], entries: Entry[], update: Update, stopped: () => boolean): Promise<void> {
	const read: Slip[] = [];
	for (const slip of batch) {
		if (stopped()) return;
		if (slip.status !== "reading") continue;
		const done = rememberPayee(await readInto(slip), entries);
		read.push(done);
		update(done.id, () => done);
	}

	const todo = read.filter((s) => s.status === "ok" && s.nameBox && s.file && !s.remembered);
	todo.forEach((s) => update(s.id, (cur) => ({ ...cur, refining: true })));
	const crops = new Map<string, HTMLCanvasElement>();
	const names = new Map<string, Partial<Names>>();
	for (const [model, key] of MODELS) {
		for (const slip of todo) {
			if (stopped()) return;
			try {
				const crop = crops.get(slip.id) ?? (await cropName(slip.file as File, slip.nameBox as NonNullable<Slip["nameBox"]>));
				crops.set(slip.id, crop);
				const got = { ...names.get(slip.id), [key]: await readName(crop, model) };
				names.set(slip.id, got);
				const best = pickName({ both: got.both ?? "", thai: got.thai ?? "", eng: got.eng ?? "" }).slice(0, 80);
				if (best) update(slip.id, (cur) => (cur.note === cur.autoNote ? { ...cur, note: best, autoNote: best } : cur));
			} catch {
				// The first guess stays; a failed closer look is not worth stopping the batch.
			}
		}
	}
	todo.forEach((s) => update(s.id, (cur) => ({ ...cur, refining: false })));
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
