import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["apps/frontend", "apps/backend"],
	},
});
