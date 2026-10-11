import { defineConfig } from "vitest/config";

// Unit tests run in plain Node; they don't need the Workers runtime from vite.config.ts.
export default defineConfig({
	test: { environment: "node", include: ["src/**/*.test.ts"] },
});
