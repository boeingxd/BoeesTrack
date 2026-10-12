import { type Context, Hono } from "hono";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, SLIP_REF } from "./wire";

// A slip's picture lives in the SLIPS bucket under the entry's slip_ref. Only an existing entry can own one.
export const slips = new Hono<{ Bindings: Env }>();

const badRef = (c: Context) => !SLIP_REF.test(c.req.param("ref") ?? "");

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
