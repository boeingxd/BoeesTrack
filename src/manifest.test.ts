import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// A wrong icon path or size fails silently on the phone (the app just won't offer to install), so check it here.
const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));

// A PNG stores its width and height as two 4-byte numbers right after the 8-byte signature and chunk header.
function pngSize(file: string): string {
	const bytes = readFileSync(file);
	return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

describe("web app manifest", () => {
	it("has what a phone needs to install the app", () => {
		expect(manifest.name).toBe("BoeesTrack");
		expect(manifest.start_url).toBe("/");
		expect(manifest.display).toBe("standalone");
	});

	it("points to icons that exist at the sizes it claims, including 192 and 512", () => {
		const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
		expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
		for (const icon of manifest.icons) expect(pngSize(`public${icon.src}`)).toBe(icon.sizes);
	});

	it("has an iOS home screen icon at 180x180, and index.html links the manifest with credentials", () => {
		expect(pngSize("public/apple-touch-icon.png")).toBe("180x180");
		expect(readFileSync("index.html", "utf8")).toContain('rel="manifest" href="/manifest.webmanifest" crossorigin="use-credentials"');
	});
});
