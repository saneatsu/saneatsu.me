import type { ContactFormValues } from "../model/contact-form-schema";

/**
 * Google FormsのエントリーIDマッピング
 *
 * Google Formを作成した後、各フィールドに対応するentry IDを設定する。
 * IDはフォームのHTMLソースから取得できる。
 *
 * TODO: Google Formを作成後、実際のentry IDに置き換える
 */
const GOOGLE_FORM_ENTRY_IDS = {
	name: "entry.XXXXXXXXX",
	email: "entry.XXXXXXXXX",
	subject: "entry.XXXXXXXXX",
	category: "entry.XXXXXXXXX",
	message: "entry.XXXXXXXXX",
} as const;

/**
 * Google FormsのformResponse URL
 *
 * TODO: Google Formを作成後、実際のフォームIDに置き換える
 */
const GOOGLE_FORM_URL =
	"https://docs.google.com/forms/d/e/FORM_ID/formResponse";

/**
 * お問い合わせ内容をGoogle Formsに送信する
 *
 * 1. フォームデータをURLSearchParamsに変換
 * 2. Google FormsのformResponseエンドポイントにPOST
 *    - CORSの制約上、レスポンスは読めないがリクエスト自体は成功する
 *
 * @param values - バリデーション済みのフォーム値
 * @throws ネットワークエラー時にError
 */
export async function fetchSubmitContactForm(
	values: ContactFormValues
): Promise<void> {
	const formData = new URLSearchParams();
	formData.append(GOOGLE_FORM_ENTRY_IDS.name, values.name);
	formData.append(GOOGLE_FORM_ENTRY_IDS.email, values.email);
	formData.append(GOOGLE_FORM_ENTRY_IDS.subject, values.subject);
	formData.append(GOOGLE_FORM_ENTRY_IDS.category, values.category);
	formData.append(GOOGLE_FORM_ENTRY_IDS.message, values.message);

	/**
	 * no-corsモードで送信する理由:
	 * Google Formsのエンドポイントは外部からのリクエストにCORSヘッダーを返さない。
	 * no-corsではレスポンスがopaqueになりステータスコードは確認できないが、
	 * リクエスト自体は正常に送信される。fetchが例外を投げなければ送信成功と見なす。
	 */
	await fetch(GOOGLE_FORM_URL, {
		method: "POST",
		mode: "no-cors",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: formData.toString(),
	});
}
