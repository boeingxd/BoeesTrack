import { type Context, Hono } from "hono";
import {
	type EntryRow,
	type PlanRow,
	type WirePot,
	entryFromRow,
	parseCategory,
	parseEntries,
	parseEntry,
	parseIds,
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
		db.prepare("SELECT id, kind, satang, at, category, note, slip_ref, pot, payee_key, has_image FROM entries ORDER BY at, id"),
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
		const insert = db.prepare("INSERT INTO entries (id, kind, satang, at, category, note, slip_ref, pot, payee_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
		await db.batch(parsed.value.map((e) => insert.bind(e.id, e.kind, e.satang, e.at, e.category, e.note, e.slipRef ?? null, e.pot ?? null, e.payeeKey ?? null)));
		return c.json({ ok: true }, 201);
	});
});

// An edit rewrites the row except slip_ref, which stays as created because the slip's picture is stored under it.
// The id in the path must match the body so one entry cannot be saved over another.
data.put("/entries/:id", async (c) => {
	const parsed = parseEntry(await json(c));
	if (!parsed.ok) return c.text(parsed.error, 400);
	const e = parsed.value;
	if (e.id !== c.req.param("id")) return c.text("id does not match", 400);
	return guard(c, async () => {
		const res = await c.env.DB.prepare("UPDATE entries SET kind = ?, satang = ?, at = ?, category = ?, note = ?, pot = ? WHERE id = ?")
			.bind(e.kind, e.satang, e.at, e.category, e.note, e.pot ?? null, e.id)
			.run();
		if (res.meta.changes === 0) return c.text("No such entry", 404);
		return c.json({ ok: true });
	});
});

// Deleting an entry also deletes its slip picture, so no orphaned image stays in the bucket.
data.delete("/entries/:id", async (c) => {
	const gone = await c.env.DB.prepare("DELETE FROM entries WHERE id = ? RETURNING slip_ref, has_image")
		.bind(c.req.param("id"))
		.first<{ slip_ref: string | null; has_image: number }>();
	if (!gone) return c.text("No such entry", 404);
	if (gone.slip_ref && gone.has_image) await c.env.SLIPS.delete(gone.slip_ref);
	return c.json({ ok: true });
});

// Many entries at once (History's "delete these"). One batch, so it all goes or none; then the pictures of the deleted rows go too.
data.post("/entries/delete", async (c) => {
	const parsed = parseIds(await json(c));
	if (!parsed.ok) return c.text(parsed.error, 400);
	const db = c.env.DB;
	const chunks: string[][] = [];
	for (let i = 0; i < parsed.value.length; i += 90) chunks.push(parsed.value.slice(i, i + 90));
	const results = await db.batch(
		chunks.map((ids) => db.prepare(`DELETE FROM entries WHERE id IN (${ids.map(() => "?").join(",")}) RETURNING slip_ref, has_image`).bind(...ids)),
	);
	const gone = results.flatMap((r) => r.results as { slip_ref: string | null; has_image: number }[]);
	const refs = gone.flatMap((row) => (row.slip_ref && row.has_image ? [row.slip_ref] : []));
	if (refs.length > 0) await c.env.SLIPS.delete(refs);
	return c.json({ deleted: gone.length });
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

// Deleting returns the pot's money in the same batch as the removal, so it can never vanish halfway.
// The entries keep their pot name on purpose: History stays as it was. The adjustment is skipped when the pot is already gone.
data.post("/pots/:name/delete", async (c) => {
	const raw = (await json(c)) as { adjust?: unknown } | null;
	const adjust = raw?.adjust == null ? null : parseEntry(raw.adjust);
	if (adjust && !adjust.ok) return c.text(adjust.error, 400);
	return guard(c, async () => {
		const name = c.req.param("name");
		const db = c.env.DB;
		const e = adjust?.ok ? adjust.value : null;
		const steps = [
			...(e
				? [
						db
							.prepare("INSERT INTO entries (id, kind, satang, at, category, note) SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM pots WHERE name = ?)")
							.bind(e.id, e.kind, e.satang, e.at, e.category, e.note, name),
					]
				: []),
			db.prepare("DELETE FROM pots WHERE name = ?").bind(name),
		];
		const results = await db.batch(steps);
		if (results[results.length - 1].meta.changes === 0) return c.text("No such pot", 404);
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

// "Other" is where a deleted tag's entries land, so it can be neither renamed nor deleted.
const KEEP = "Other";

// The tag and its entries change in one batch, so a rename never leaves entries with a tag that is gone.
data.put("/categories/:name", async (c) => {
	const parsed = parseCategory(await json(c));
	if (!parsed.ok) return c.text(parsed.error, 400);
	const old = c.req.param("name");
	if (old === KEEP) return c.text("Other cannot be renamed", 400);
	return guard(c, async () => {
		const db = c.env.DB;
		const [category] = await db.batch([
			db.prepare("UPDATE categories SET name = ? WHERE name = ?").bind(parsed.value, old),
			db.prepare("UPDATE entries SET category = ? WHERE category = ?").bind(parsed.value, old),
		]);
		if (category.meta.changes === 0) return c.text("No such category", 404);
		return c.json({ ok: true });
	});
});

// Entries that used the tag move to Other in the same batch as the removal.
data.post("/categories/:name/delete", async (c) => {
	const name = c.req.param("name");
	if (name === KEEP) return c.text("Other cannot be deleted", 400);
	const db = c.env.DB;
	const results = await db.batch([
		db.prepare("UPDATE entries SET category = ? WHERE category = ?").bind(KEEP, name),
		db.prepare("DELETE FROM categories WHERE name = ?").bind(name),
	]);
	if (results[1].meta.changes === 0) return c.text("No such category", 404);
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
