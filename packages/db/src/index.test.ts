import { describe, expect, it } from "vitest";
import { db } from "./index";

describe("Database package", () => {
	it("should export drizzle db instance", () => {
		expect(db).toBeDefined();
		expect(typeof db).toBe("object");
	});
});
