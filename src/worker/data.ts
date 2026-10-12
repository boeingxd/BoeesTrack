import { type Context, Hono } from "hono";
import {
	type EntryRow,
	type PlanRow,
	type WirePot,
	entryFromRow,
	parseCategory,
	parseEntries,
	parsePlan,
	parsePot,
	planFromRow,
	planToColumns,
} from "./wire";

export const data = new Hono<{ Bindings: Env }>();

// A UNIQUE clash (same entry id, slip ref, pot or category name) is the caller's mistake, not a crash.
async function guard(c: Context, run: () => Promise<Response>): Promise<Response> {
	try {
		return await run();
	} catch (e) {
		if (e instanceof Error && e.message.includes("UNIQUE")) return c.text("Already exists", 409);
		throw e;
	}
}

const json = (c: Context) => c.req.json().catch(() => null);

data.get("/data", async (c) => {
	const db = c.env.DB;
	const [entries, pots, categories, plan] = await db.batch([
		db.prepare("SELECT id, kind, satang, at, category, note, slip_ref, pot FROM entries ORDER BY at, id"),
		db.prepare("SELECT name, target, monthly FROM pots ORDER BY rowid"),
		db.prepare("SELECT name FROM categories ORDER BY position"),
		db.prepare("SELECT monthly, daily_mode, daily_fixed FROM plan WHERE id = 1"),
	]);
	return c.json({
		entries: (entries.results as EntryRow[]).map(entryFromRow),
		pots: pots.results as WirePot[],
		categories: (categories.results as { name: string }[]).map((r) => r.name),
		plan: planFromRow((plan.results as PlanRow[])[0]),
	});
});

data.post("/entries", async (c) => {
	const parsed = parseEntries(await json(c));
	if (!parsed.ok) return c.text(parsed.error, 400);
	return guard(c, async () => {
		const db = c.env.DB;
		const insert = db.prepare("INSERT INTO entries (id, kind, satang, at, category, note, slip_ref, pot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
		await db.batch(parsed.value.map((e) => insert.bind(e.id, e.kind, e.satang, e.at, e.category, e.note, e.slipRef ?? null, e.pot ?? null)));
		return c.json({ ok: true }, 201);
	});
});

data.post("/pots", async (c) => {
	const parsed = parsePot(await json(c));
	if (!parsed.ok) return c.text(parsed.error, 400);
	return guard(c, async () => {
		const { name, target, monthly } = parsed.value;
		await c.env.DB.prepare("INSERT INTO pots (name, target, monthly) VALUES (?, ?, ?)").bind(name, target, monthly).run();
		return c.json({ ok: true }, 201);
	});
});

// The pot and its entries change in one batch, so a rename never leaves entries pointing at a pot that is gone.
data.put("/pots/:name", async (c) => {
	const parsed = parsePot(await json(c));
	if (!parsed.ok) return c.text(parsed.error, 400);
	return guard(c, async () => {
		const old = c.req.param("name");
		const { name, target, monthly } = parsed.value;
		const db = c.env.DB;
		const [pot] = await db.batch([
			db.prepare("UPDATE pots SET name = ?, target = ?, monthly = ? WHERE name = ?").bind(name, target, monthly, old),
			db.prepare("UPDATE entries SET pot = ? WHERE pot = ?").bind(name, old),
		]);
		if (pot.meta.changes === 0) return c.text("No such pot", 404);
		return c.json({ ok: true });
	});
});

data.put("/plan", async (c) => {
	const parsed = parsePlan(await json(c));
	if (!parsed.ok) return c.text(parsed.error, 400);
	const { mode, fixed } = planToColumns(parsed.value);
	await c.env.DB.prepare("UPDATE plan SET monthly = ?, daily_mode = ?, daily_fixed = ? WHERE id = 1").bind(parsed.value.monthly, mode, fixed).run();
	return c.json({ ok: true });
});

data.post("/categories", async (c) => {
	const parsed = parseCategory(await json(c));
	if (!parsed.ok) return c.text(parsed.error, 400);
	return guard(c, async () => {
		await c.env.DB.prepare("INSERT INTO categories (name, position) VALUES (?, (SELECT COALESCE(MAX(position), 0) + 1 FROM categories))")
			.bind(parsed.value)
			.run();
		return c.json({ ok: true }, 201);
	});
});
