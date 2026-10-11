import { Hono } from "hono";
import { accessKeys, verifyAccessToken } from "./access";

// ACCESS_BYPASS exists only in .dev.vars for local development; it is never set in wrangler.json.
type Bindings = Env & { ACCESS_BYPASS?: string };

const app = new Hono<{ Bindings: Bindings }>();

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
	} catch {
		return c.text("Invalid Access token", 403);
	}
	return next();
});

app.get("/api/health", (c) => c.json({ status: "ok" }));

export default app;
