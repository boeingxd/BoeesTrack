import { type Context, Hono } from "hono";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, SLIP_REF, parseBefore } from "./wire";

// A slip's picture lives in the SLIPS bucket under the entry's slip_ref. Only an existing entry can own one.
export const slips = new Hono<{ Bindings: Env }>();

const badRef = (c: Context) => !SLIP_REF.test(c.req.param("ref") ?? "");

// "Old" means the entry's own date, not the upload date. These two routes sit beside /slips/:ref; "slips-usage" and "slips-clear" are not valid slip references, so they cannot clash.
const oldPictureRefs = async (db: D1Database, before: number) =>
	(await db.prepare("SELECT slip_ref FROM entries WHERE has_image = 1 AND slip_ref IS NOT NULL AND at < ?").bind(before).all<{ slip_ref: string }>()).results.map((r) => r.slip_ref);

// How many pictures are older than the cutoff and how much space they take, so the owner sees it before removing anything.
slips.get("/slips-usage", async (c) => {
	const before = parseBefore(c.req.query("before"));
	if (before === null) return c.text("bad before", 400);
	const refs = new Set(await oldPictureRefs(c.env.DB, before));
	let bytes = 0;
	let cursor: string | undefined;
	do {
		const page = await c.env.SLIPS.list({ cursor });
		for (const object of page.objects) if (refs.has(object.key)) bytes += object.size;
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);
	return c.json({ count: refs.size, bytes });
});

// Removes only the pictures; the entries stay. The bucket goes first, so a half-finished run leaves a flag that the next run clears.
slips.post("/slips-clear", async (c) => {
	const before = parseBefore((await c.req.json().catch(() => null))?.before);
	if (before === null) return c.text("bad before", 400);
	const refs = await oldPictureRefs(c.env.DB, before);
	for (let i = 0; i < refs.length; i += 90) {
		const chunk = refs.slice(i, i + 90);
		await c.env.SLIPS.delete(chunk);
		await c.env.DB.prepare(`UPDATE entries SET has_image = 0 WHERE slip_ref IN (${chunk.map(() => "?").join(",")})`).bind(...chunk).run();
	}
	return c.json({ removed: refs.length });
});

slips.put("/slips/:ref", async (c) => {
	const ref = c.req.param("ref");
	if (badRef(c)) return c.text("bad slip reference", 400);
	const type = c.req.header("content-type")?.split(";")[0].trim() ?? "";
	if (!IMAGE_TYPES.includes(type)) return c.text("expected a jpeg, png or webp image", 415);
	const body = await c.req.arrayBuffer();
	if (body.byteLength === 0 || body.byteLength > MAX_IMAGE_BYTES) return c.text("image must be 1 byte to 6 MB", 413);
	const entry = await c.env.DB.prepare("SELECT 1 FROM entries WHERE slip_ref = ?").bind(ref).first();
	if (!entry) return c.text("No entry has this slip", 404);
	await c.env.SLIPS.put(ref, body, { httpMetadata: { contentType: type } });
	await c.env.DB.prepare("UPDATE entries SET has_image = 1 WHERE slip_ref = ?").bind(ref).run();
	return c.json({ ok: true });
});

slips.get("/slips/:ref", async (c) => {
	if (badRef(c)) return c.text("bad slip reference", 400);
	const image = await c.env.SLIPS.get(c.req.param("ref"));
	if (!image) return c.text("No picture", 404);
	return new Response(image.body, {
		headers: {
			"content-type": image.httpMetadata?.contentType ?? "application/octet-stream",
			// Private: it shows account details. nosniff stops a browser treating stored bytes as anything but an image.
			"cache-control": "private, max-age=86400",
			"x-content-type-options": "nosniff",
		},
	});
});

// Removes only the picture; the entry stays. Safe to repeat.
slips.delete("/slips/:ref", async (c) => {
	if (badRef(c)) return c.text("bad slip reference", 400);
	const ref = c.req.param("ref");
	await c.env.SLIPS.delete(ref);
	await c.env.DB.prepare("UPDATE entries SET has_image = 0 WHERE slip_ref = ?").bind(ref).run();
	return c.json({ ok: true });
});
