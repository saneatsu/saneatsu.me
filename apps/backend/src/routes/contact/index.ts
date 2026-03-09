import { OpenAPIHono } from "@hono/zod-openapi";

import type { Env } from "@/env";

import { submitContact } from "./handlers/submit-contact/submit-contact";
import { submitContactRoute } from "./handlers/submit-contact/submit-contact.openapi";

/**
 * お問い合わせ関連のAPIルート
 */
export const contactRoute = new OpenAPIHono<{ Bindings: Env }>()
	// お問い合わせフォーム送信
	.openapi(submitContactRoute, submitContact);
