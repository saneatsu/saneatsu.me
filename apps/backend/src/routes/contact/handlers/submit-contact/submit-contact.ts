import type { RouteHandler } from "@hono/zod-openapi";

import type { Env } from "@/env";

import type { submitContactRoute } from "./submit-contact.openapi";

type Handler = RouteHandler<typeof submitContactRoute, { Bindings: Env }>;

/**
 * カテゴリ値から日本語ラベルへの変換マップ
 *
 * Google Formsのスプレッドシート上で日本語のカテゴリ名が記録されるようにするため、
 * 送信時に英語のカテゴリ値を日本語に変換する。
 */
const CATEGORY_LABELS: Record<string, string> = {
	business: "お仕事のご依頼・ご相談",
	feedback: "フィードバック・ご感想",
	"bug-report": "不具合の報告",
	other: "その他",
};

/**
 * Google FormsのエントリーIDマッピング
 *
 * Google Formを作成した後、各フィールドに対応するentry IDを設定する。
 * IDはフォームのHTMLソースから取得できる。
 */
const GOOGLE_FORM_ENTRY_IDS = {
	name: "entry.980795320",
	company: "entry.1318157450",
	jobTitle: "entry.1932368525",
	email: "entry.947606279",
	subject: "entry.1779250826",
	category: "entry.1878738171",
	message: "entry.1448652520",
} as const;

/**
 * POST /api/contact - お問い合わせフォーム送信
 *
 * @description
 * 1. リクエストボディからフォームデータを取得
 * 2. URLSearchParamsに変換してGoogle Formsに送信
 *    - サーバーサイドからのfetchのためCORS制約なし
 *    - Google Formsは送信成功時に302リダイレクトを返すため `redirect: "manual"` を使用
 * 3. レスポンスステータスで成功/失敗を判定（200または302が成功）
 */
export const submitContact: Handler = async (c) => {
	try {
		// 1. リクエストボディからフォームデータを取得
		const body = c.req.valid("json");

		// 2. URLSearchParamsに変換してGoogle Formsに送信
		const formData = new URLSearchParams();
		formData.append(GOOGLE_FORM_ENTRY_IDS.name, body.name);
		formData.append(GOOGLE_FORM_ENTRY_IDS.company, body.company);
		if (body.jobTitle) {
			formData.append(GOOGLE_FORM_ENTRY_IDS.jobTitle, body.jobTitle);
		}
		formData.append(GOOGLE_FORM_ENTRY_IDS.email, body.email);
		formData.append(GOOGLE_FORM_ENTRY_IDS.subject, body.subject);
		formData.append(
			GOOGLE_FORM_ENTRY_IDS.category,
			CATEGORY_LABELS[body.category] ?? body.category
		);
		formData.append(GOOGLE_FORM_ENTRY_IDS.message, body.message);

		const googleFormUrl = c.env.GOOGLE_FORM_URL;

		const response = await fetch(googleFormUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData.toString(),
			redirect: "manual",
		});

		// 3. レスポンスステータスで成功/失敗を判定
		// Google Formsは成功時に200または302を返す
		if (response.status === 200 || response.status === 302) {
			return c.json({ success: true }, 200);
		}

		console.error("Google Forms submission failed:", {
			status: response.status,
			statusText: response.statusText,
		});

		return c.json(
			{
				error: {
					code: "SUBMISSION_FAILED",
					message:
						"お問い合わせの送信に失敗しました。時間をおいて再度お試しください。",
				},
			},
			500
		);
	} catch (err) {
		console.error("Contact form submission error:", {
			error: err,
			message: err instanceof Error ? err.message : "Unknown error",
		});

		return c.json(
			{
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message:
						"お問い合わせの送信中にエラーが発生しました。時間をおいて再度お試しください。",
				},
			},
			500
		);
	}
};
