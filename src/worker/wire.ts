// What travels between the app and the Worker, and what D1 rows look like.
// The Worker never trusts the browser: every body is checked here before it touches the database.

export const KINDS = ["spent", "received", "saved", "adjust"] as const;
export type WireKind = (typeof KINDS)[number];

// `at` is UTC milliseconds on the wire; only the app turns it into a Date.
export type WireEntry = {
	id: string;
	kind: WireKind;
	satang: number;
	at: number;
	category: string | null;
	note: string;
	slipRef?: string;
	pot?: string;
};
export type WirePot = { name: string; target: number; monthly: number };
export type WirePlan = { monthly: number; daily: "auto" | "off" | { fixed: number } };

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export const MAX_BATCH = 200;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v);
const isText = (v: unknown, max: number): v is string => typeof v === "string" && v.trim() !== "" && v.length <= max;

function parseEntry(raw: unknown): Parsed<WireEntry> {
	if (!isObject(raw)) return fail("entry must be an object");
	const { id, kind, satang, at, category, note, slipRef, pot } = raw;
	if (!isText(id, 100)) return fail("bad id");
	if (!KINDS.includes(kind as WireKind)) return fail("bad kind");
	if (!isInt(satang) || satang === 0 || (kind !== "adjust" && satang < 0)) return fail("bad satang");
	if (!isInt(at) || at < 0) return fail("bad at");
	if (category !== null && !isText(category, 50)) return fail("bad category");
	if (typeof note !== "string" || note.length > 500) return fail("bad note");
	if (slipRef !== undefined && !isText(slipRef, 100)) return fail("bad slipRef");
	if (pot !== undefined && !isText(pot, 50)) return fail("bad pot");
	if (kind === "saved" && pot === undefined) return fail("a saved entry needs a pot");
	return {
		ok: true,
		value: {
			id,
			kind: kind as WireKind,
			satang,
			at,
			category: category as string | null,
			note,
			...(slipRef !== undefined ? { slipRef } : {}),
			...(pot !== undefined ? { pot } : {}),
		},
	};
}

export function parseEntries(body: unknown): Parsed<WireEntry[]> {
	if (!Array.isArray(body) || body.length === 0 || body.length > MAX_BATCH) return fail("expected 1 to 200 entries");
	const out: WireEntry[] = [];
	for (const raw of body) {
		const r = parseEntry(raw);
		if (!r.ok) return r;
		out.push(r.value);
	}
	if (new Set(out.map((e) => e.id)).size !== out.length) return fail("repeated id");
	return { ok: true, value: out };
}

export function parsePot(body: unknown): Parsed<WirePot> {
	if (!isObject(body)) return fail("pot must be an object");
	const { name, target, monthly } = body;
	if (!isText(name, 50)) return fail("bad name");
	if (!isInt(target) || target < 0) return fail("bad target");
	if (!isInt(monthly) || monthly < 0) return fail("bad monthly");
	return { ok: true, value: { name: name.trim(), target, monthly } };
}

export function parsePlan(body: unknown): Parsed<WirePlan> {
	if (!isObject(body)) return fail("plan must be an object");
	const { monthly, daily } = body;
	if (!isInt(monthly) || monthly < 0) return fail("bad monthly");
	if (daily === "auto" || daily === "off") return { ok: true, value: { monthly, daily } };
	if (isObject(daily) && isInt(daily.fixed) && daily.fixed >= 0) return { ok: true, value: { monthly, daily: { fixed: daily.fixed } } };
	return fail("bad daily");
}

export function parseCategory(body: unknown): Parsed<string> {
	if (!isObject(body) || !isText(body.name, 50)) return fail("bad name");
	return { ok: true, value: (body.name as string).trim() };
}

export type EntryRow = {
	id: string;
	kind: WireKind;
	satang: number;
	at: number;
	category: string | null;
	note: string;
	slip_ref: string | null;
	pot: string | null;
};

export function entryFromRow(r: EntryRow): WireEntry {
	return {
		id: r.id,
		kind: r.kind,
		satang: r.satang,
		at: r.at,
		category: r.category,
		note: r.note,
		...(r.slip_ref ? { slipRef: r.slip_ref } : {}),
		...(r.pot ? { pot: r.pot } : {}),
	};
}

export type PlanRow = { monthly: number; daily_mode: "auto" | "off" | "fixed"; daily_fixed: number | null };

export function planFromRow(r: PlanRow): WirePlan {
	return { monthly: r.monthly, daily: r.daily_mode === "fixed" ? { fixed: r.daily_fixed ?? 0 } : r.daily_mode };
}

export function planToColumns(plan: WirePlan): { mode: "auto" | "off" | "fixed"; fixed: number | null } {
	return typeof plan.daily === "string" ? { mode: plan.daily, fixed: null } : { mode: "fixed", fixed: plan.daily.fixed };
}
