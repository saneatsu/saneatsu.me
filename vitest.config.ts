import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["apps/frontend", "apps/backend"],
		coverage: {
			reporter: ["text", "json-summary", "json"],
			reportsDirectory: "./coverage",
		},
	},
});
