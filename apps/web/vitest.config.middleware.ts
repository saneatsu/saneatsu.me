import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		environment: "node",
		setupFiles: ["./vitest.setup.middleware.ts"],
		globals: true,
		include: ["**/*.middleware.test.{js,ts,mjs,mts}"],
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});