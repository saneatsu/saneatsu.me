/**
 * APIエラーからユーザー向けのエラーメッセージを抽出する
 *
 * @param error - APIから返されたエラーオブジェクト
 * @param fallbackMessage - デフォルトのエラーメッセージ
 * @returns ユーザー向けのエラーメッセージ
 *
 * @description
 * 以下のエラー形式に対応：
 * 1. 直接配列（Zodバリデーションエラー）: `[{ code, path, message }]`
 * 2. error.errorが配列: `{ error: [{ code, path, message }] }`
 * 3. error.errorがオブジェクト: `{ error: { message: string } }`
 * 4. error.errorが文字列: `{ error: "error message" }`
 * 5. Errorインスタンス: `Error("error message")`
 * 6. messageプロパティを持つオブジェクト: `{ message: "error message" }`
 */
export function extractErrorMessage(
	error: unknown,
	fallbackMessage: string
): string {
	let errorMessage = fallbackMessage;

	// errorが直接配列の場合（Zodバリデーションエラー）
	if (Array.isArray(error) && error.length > 0) {
		errorMessage = error[0].message || errorMessage;
	}
	// error.errorが配列の場合（Zodバリデーションエラー）
	else if (
		error &&
		typeof error === "object" &&
		"error" in error &&
		Array.isArray(error.error) &&
		error.error.length > 0
	) {
		errorMessage = error.error[0].message || errorMessage;
	}
	// エラーオブジェクトの場合
	else if (error && typeof error === "object" && "error" in error) {
		const apiError = error.error;
		if (
			typeof apiError === "object" &&
			apiError !== null &&
			"message" in apiError
		) {
			errorMessage = (apiError as { message?: string }).message || errorMessage;
		} else if (typeof apiError === "string") {
			errorMessage = apiError;
		}
	}
	// Error インスタンスの場合
	else if (error instanceof Error) {
		errorMessage = error.message;
	}
	// messageフィールドがある場合
	else if (error && typeof error === "object" && "message" in error) {
		errorMessage = (error as { message?: string }).message || errorMessage;
	}

	return errorMessage;
}
