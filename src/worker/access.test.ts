import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { verifyAccessToken } from "./access";

const expected = {
	issuer: "https://team.cloudflareaccess.com",
	audience: "app-aud-tag",
};

async function setup() {
	const { publicKey, privateKey } = await generateKeyPair("RS256");
	const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
	return { privateKey, keys: createLocalJWKSet({ keys: [jwk] }) };
}

function sign(
	privateKey: CryptoKey,
	claims: { iss?: string; aud?: string; exp?: string },
) {
	return new SignJWT({ email: "me@example.com" })
		.setProtectedHeader({ alg: "RS256", kid: "k1" })
		.setIssuer(claims.iss ?? expected.issuer)
		.setAudience(claims.aud ?? expected.audience)
		.setExpirationTime(claims.exp ?? "1h")
		.sign(privateKey);
}

describe("verifyAccessToken", () => {
	it("accepts a correctly signed token for this app", async () => {
		const { privateKey, keys } = await setup();
		const payload = await verifyAccessToken(
			await sign(privateKey, {}),
			keys,
			expected,
		);
		expect(payload.email).toBe("me@example.com");
	});

	it("rejects a token signed by a different key", async () => {
		const { keys } = await setup();
		const other = await setup();
		const token = await sign(other.privateKey, {});
		await expect(verifyAccessToken(token, keys, expected)).rejects.toThrow();
	});

	it("rejects a token meant for a different application", async () => {
		const { privateKey, keys } = await setup();
		const token = await sign(privateKey, { aud: "another-app" });
		await expect(verifyAccessToken(token, keys, expected)).rejects.toThrow();
	});

	it("rejects a token from a different issuer", async () => {
		const { privateKey, keys } = await setup();
		const token = await sign(privateKey, { iss: "https://evil.example.com" });
		await expect(verifyAccessToken(token, keys, expected)).rejects.toThrow();
	});

	it("rejects an expired token", async () => {
		const { privateKey, keys } = await setup();
		const token = await sign(privateKey, { exp: "-1m" });
		await expect(verifyAccessToken(token, keys, expected)).rejects.toThrow();
	});
});
