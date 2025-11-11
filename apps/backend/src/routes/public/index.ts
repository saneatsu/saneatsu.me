import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/env";

import { getPublicContributions } from "./handlers/get-contributions/get-contributions";
import { getPublicContributionsRoute } from "./handlers/get-contributions/get-contributions.openapi";

export const publicRoute = new OpenAPIHono<{ Bindings: Env }>().openapi(
	getPublicContributionsRoute,
	getPublicContributions
);
