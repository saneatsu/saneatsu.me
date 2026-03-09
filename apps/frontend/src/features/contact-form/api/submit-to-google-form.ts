import { env } from "@/env";

import type { ContactFormValues } from "../model/contact-form-schema";

/**
 * お問い合わせ内容をバックエンドAPI経由でGoogle Formsに送信する
 *
 * 1. バックエンドの POST /api/contact にJSON形式で送信
 * 2. サーバーサイドでGoogle Formsに転送される
 * 3. レスポンスのステータスコードで成功/失敗を判定
 *
 * @param values - バリデーション済みのフォーム値
 * @throws 送信失敗時にError
 */
export async function fetchSubmitContactForm(
	values: ContactFormValues
): Promise<void> {
	// 1. バックエンドAPIに送信
	const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/contact`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			name: values.name,
			company: values.company,
			jobTitle: values.jobTitle || undefined,
			email: values.email,
			subject: values.subject,
			category: values.category,
			message: values.message,
		}),
	});

	// 2. レスポンスのステータスコードで成功/失敗を判定
	if (!response.ok) {
		throw new Error("Contact form submission failed");
	}
}
