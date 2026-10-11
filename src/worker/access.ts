import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

type ExpectedClaims = { issuer: string; audience: string };

// Checks the signature and the issuer/audience claims of a Cloudflare Access token.
export async function verifyAccessToken(
	token: string,
	keys: JWTVerifyGetKey,
	expected: ExpectedClaims,
) {
	const { payload } = await jwtVerify(token, keys, expected);
	return payload;
}

// Created once so the signing keys are fetched and cached across requests.
let remoteKeys: JWTVerifyGetKey | undefined;

export function accessKeys(teamDomain: string) {
	remoteKeys ??= createRemoteJWKSet(
		new URL(`${teamDomain}/cdn-cgi/access/certs`),
	);
	return remoteKeys;
}
