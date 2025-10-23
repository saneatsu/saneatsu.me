import type { Config } from "drizzle-kit";

const isDevelopment = process.env.NODE_ENV === "development";

export default {
	schema: "./src/schema/*",
	out: "./drizzle",
	dialect: "turso",
	dbCredentials: isDevelopment
		? {
				url: "file:./local.db",
			}
		: {
				url: process.env.TURSO_DATABASE_URL || "",
				authToken: process.env.TURSO_AUTH_TOKEN || "",
			},
} satisfies Config;
