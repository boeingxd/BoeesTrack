import { describe, expect, it } from "vitest";
import app from "./index";

const env = { TEAM_DOMAIN: "https://team.cloudflareaccess.com", POLICY_AUD: "app-aud-tag" };

describe("the /api gate", () => {
	it("refuses a request with no Access token", async () => {
		expect((await app.request("/api/health", {}, env)).status).toBe(403);
	});

	it("refuses a token that is not a real one", async () => {
		const res = await app.request("/api/health", { headers: { "cf-access-jwt-assertion": "not-a-token" } }, env);
		expect(res.status).toBe(403);
	});

	it("opens only when ACCESS_BYPASS is exactly true", async () => {
		expect((await app.request("/api/health", {}, { ...env, ACCESS_BYPASS: "false" })).status).toBe(403);
		expect((await app.request("/api/health", {}, { ...env, ACCESS_BYPASS: "true" })).status).toBe(200);
	});

	it("fails closed when the Access settings are missing", async () => {
		expect((await app.request("/api/health", {}, {})).status).toBe(500);
	});

	it("refuses a form post from another site", async () => {
		const res = await app.request(
			"http://localhost/api/slips-clear",
			{ method: "POST", headers: { "content-type": "text/plain", origin: "https://evil.example" }, body: "{}" },
			{ ...env, ACCESS_BYPASS: "true" },
		);
		expect(res.status).toBe(403);
	});
});
