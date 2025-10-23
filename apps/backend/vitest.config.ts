import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		// WARNING: VSCodeのVitestプラグインで module not found のエラーが出るため、
		// 以下の書き方は使用しないこと
		// setupFiles: ["./vitest.setup.ts"],
		setupFiles: [path.resolve(__dirname, "./vitest.setup.ts")],
		coverage: {
			reporter: ["text", "json-summary", "json", "html"],
			reportsDirectory: "./coverage",
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@saneatsu/backend": path.resolve(__dirname, "./src"),
			"@saneatsu/db": path.resolve(__dirname, "../../packages/db/src"),
			"@saneatsu/schemas": path.resolve(
				__dirname,
				"../../packages/schemas/src"
			),
		},
	},
});
