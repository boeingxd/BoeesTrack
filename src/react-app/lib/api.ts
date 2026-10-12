import type { WireEntry, WirePlan, WirePot } from "../../worker/wire";
import type { BudgetPlan, Entry, Pot } from "./types";

// Dates travel as UTC milliseconds; this file is the only place they are converted.
export const toWire = (e: Entry): WireEntry => ({
	id: e.id,
	kind: e.kind,
	satang: e.satang,
	at: e.at.getTime(),
	category: e.category,
	note: e.note,
	...(e.slipRef ? { slipRef: e.slipRef } : {}),
	...(e.pot ? { pot: e.pot } : {}),
	...(e.payeeKey ? { payeeKey: e.payeeKey } : {}),
});

export const fromWire = (w: WireEntry): Entry => ({ ...w, at: new Date(w.at) });

async function call(method: string, path: string, body?: unknown): Promise<Response> {
	const res = await fetch(`/api${path}`, {
		method,
		...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
	});
	if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
	return res;
}

export async function loadAll(): Promise<{ entries: Entry[]; pots: Pot[]; categories: string[]; plan: BudgetPlan }> {
	const all = (await (await call("GET", "/data")).json()) as { entries: WireEntry[]; pots: WirePot[]; categories: string[]; plan: WirePlan };
	return { ...all, entries: all.entries.map(fromWire) };
}

export const addEntries = (entries: Entry[]) => call("POST", "/entries", entries.map(toWire)).then(() => undefined);
export const editEntry = (entry: Entry) => call("PUT", `/entries/${encodeURIComponent(entry.id)}`, toWire(entry)).then(() => undefined);
export const deleteEntry = (id: string) => call("DELETE", `/entries/${encodeURIComponent(id)}`).then(() => undefined);
export const deleteEntries = (ids: string[]) => call("POST", "/entries/delete", { ids }).then(() => undefined);
export const addPot = (pot: Pot) => call("POST", "/pots", pot).then(() => undefined);
export const editPot = (oldName: string, pot: Pot) => call("PUT", `/pots/${encodeURIComponent(oldName)}`, pot).then(() => undefined);
export const savePlan = (plan: BudgetPlan) => call("PUT", "/plan", plan).then(() => undefined);
export const addCategory = (name: string) => call("POST", "/categories", { name }).then(() => undefined);

// The picture goes up as raw bytes, after its entry is saved: the Worker only stores pictures for entries that exist.
export async function putSlip(ref: string, file: Blob): Promise<void> {
	const res = await fetch(`/api/slips/${ref}`, { method: "PUT", headers: { "content-type": file.type }, body: file });
	if (!res.ok) throw new Error(`PUT /slips failed: ${res.status}`);
}

export const deleteSlip = (ref: string) => call("DELETE", `/slips/${ref}`).then(() => undefined);

export const slipUsage = async (before: Date): Promise<{ count: number; bytes: number }> =>
	(await call("GET", `/slips-usage?before=${before.getTime()}`)).json();
export const clearSlips = (before: Date) => call("POST", "/slips-clear", { before: before.getTime() }).then(() => undefined);
