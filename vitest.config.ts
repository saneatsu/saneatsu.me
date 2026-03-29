import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["apps/frontend", "apps/backend", "packages/schemas"],
		coverage: {
			reporter: ["text", "json-summary", "json"],
			reportsDirectory: "./coverage",
		},
	},
});
