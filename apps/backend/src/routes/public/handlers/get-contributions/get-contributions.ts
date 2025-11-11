import type { RouteHandler } from "@hono/zod-openapi";

import type { Env } from "@/env";
import { getDatabase } from "@/lib/database";
import {
	CONTRIBUTION_RANGE_OPTIONS,
	getContributionSummary,
} from "@/lib/get-contribution-summary";

import type { getPublicContributionsRoute } from "./get-contributions.openapi";

const RANGE_SET = new Set<number>(CONTRIBUTION_RANGE_OPTIONS);

export const getPublicContributions: RouteHandler<
	typeof getPublicContributionsRoute,
	{ Bindings: Env }
> = async (c) => {
	try {
		const query = c.req.valid("query");
		const parsedRange = query.range
			? Number.parseInt(query.range, 10)
			: undefined;

		if (parsedRange && !RANGE_SET.has(parsedRange)) {
			return c.json(
				{
					error: "range must be one of 30, 90, 180, 365",
				},
				400
			);
		}

		const { createDatabaseClient } = await getDatabase();
		const db = createDatabaseClient(c.env);

		const summary = await getContributionSummary(db, {
			rangeDays: parsedRange ?? 365,
		});

		c.header(
			"Cache-Control",
			"public, max-age=300, stale-while-revalidate=3600"
		);
		return c.json(summary, 200);
	} catch (error) {
		console.error("Error fetching public contributions:", error);
		return c.json({ error: "contribution data fetch failed" }, 500);
	}
};
