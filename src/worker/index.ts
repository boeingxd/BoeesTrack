import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { accessKeys, verifyAccessToken } from "./access";
import { data } from "./data";
import { slips } from "./slips";

// ACCESS_BYPASS exists only in .dev.vars for local development; it is never set in wrangler.json.
type Bindings = Env & { ACCESS_BYPASS?: string };

const app = new Hono<{ Bindings: Bindings }>();

// Access builds its token from a browser cookie, so a form on another site must not be able to write here.
app.use("/api/*", csrf());

app.use("/api/*", async (c, next) => {
	if (c.env.ACCESS_BYPASS === "true") return next();

	const { TEAM_DOMAIN, POLICY_AUD } = c.env;
	if (!TEAM_DOMAIN || !POLICY_AUD) return c.text("Server misconfigured", 500);

	const token = c.req.header("cf-access-jwt-assertion");
	if (!token) return c.text("Missing Access token", 403);

	try {
		await verifyAccessToken(token, accessKeys(TEAM_DOMAIN), {
			issuer: TEAM_DOMAIN,
			audience: POLICY_AUD,
		});
	} catch (e) {
		console.error(e);
		return c.text("Invalid Access token", 403);
	}
	return next();
});

app.get("/api/health", (c) => c.json({ status: "ok" }));
app.route("/api", data);
app.route("/api", slips);

export default app;
