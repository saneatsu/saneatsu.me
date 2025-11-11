import { OpenAPIHono } from "@hono/zod-openapi";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicContributions } from "./get-contributions";
import { getPublicContributionsRoute } from "./get-contributions.openapi";

const getContributionSummaryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/get-contribution-summary", () => ({
	getContributionSummary: getContributionSummaryMock,
	CONTRIBUTION_RANGE_OPTIONS: [30, 90, 180, 365] as const,
}));

vi.mock("@/lib/database", () => ({
	getDatabase: async () => ({
		createDatabaseClient: () => ({}),
		articles: {},
	}),
}));

describe("GET /api/public/contributions", () => {
	beforeEach(() => {
		getContributionSummaryMock.mockReset();
		getContributionSummaryMock.mockResolvedValue({
			startDate: "2025-11-09",
			endDate: "2025-11-11",
			totalJaChars: 1200,
			maxJaChars: 500,
			days: [
				{ date: "2025-11-09", jaChars: 200 },
				{ date: "2025-11-10", jaChars: 500 },
				{ date: "2025-11-11", jaChars: 500 },
			],
			lastUpdated: "2025-11-11T00:00:00Z",
		});
	});

	it("執筆データとキャッシュヘッダーを返す", async () => {
		const app = new OpenAPIHono<{
			Bindings: { TURSO_DATABASE_URL: string; TURSO_AUTH_TOKEN: string };
		}>();
		// @ts-expect-error typed via OpenAPI later
		app.openapi(getPublicContributionsRoute, getPublicContributions);

		const client = testClient(app, {
			TURSO_DATABASE_URL: "test://db",
			TURSO_AUTH_TOKEN: "token",
		}) as any;

		const res = await client.contributions.$get({ query: { range: "180" } });
		expect(res.status).toBe(200);
		expect(res.headers.get("cache-control")).toContain("max-age=300");
		const body = await res.json();
		expect(body.totalJaChars).toBe(1200);
		expect(getContributionSummaryMock).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({ rangeDays: 180 })
		);
	});

	it("範囲パラメータが不正なら400で弾く", async () => {
		const app = new OpenAPIHono<{
			Bindings: { TURSO_DATABASE_URL: string; TURSO_AUTH_TOKEN: string };
		}>();
		// @ts-expect-error typed via OpenAPI later
		app.openapi(getPublicContributionsRoute, getPublicContributions);

		const client = testClient(app, {
			TURSO_DATABASE_URL: "test://db",
			TURSO_AUTH_TOKEN: "token",
		}) as any;

		const res = await client.contributions.$get({ query: { range: "7" } });
		expect(res.status).toBe(400);
	});
});
