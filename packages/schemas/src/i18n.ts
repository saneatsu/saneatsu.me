import type { Locale } from "@saneatsu/i18n";
import { z } from "zod";

/**
 * Zodエラーメッセージの国際化対応
 *
 * 使用例:
 * ```typescript
 * import { z } from "zod";
 * import { makeZodI18nMap } from "@saneatsu/schemas";
 *
 * // クライアントサイド（next-intl使用）
 * const t = useTranslations();
 * z.setErrorMap(makeZodI18nMap(t));
 *
 * // サーバーサイド
 * const messages = await getMessages(locale);
 * const t = (key: string, values?: any) => {
 *   // メッセージ取得ロジック
 * };
 * z.setErrorMap(makeZodI18nMap(t));
 * ```
 */
export const makeZodI18nMap = (
	t: (key: string, values?: Record<string, unknown>) => string
): z.ZodErrorMap => {
	return (issue) => {
		// メッセージを格納する変数
		let message: string | undefined;

		switch (issue.code) {
			case z.ZodIssueCode.invalid_type:
				// 必須フィールドチェック
				if (issue.received === "undefined") {
					message = t("validation.required");
				} else {
					// 型エラー
					const expectedType = issue.expected;
					switch (expectedType) {
						case "string":
							message = t("validation.invalidType.string");
							break;
						case "number":
							message = t("validation.invalidType.number");
							break;
						case "boolean":
							message = t("validation.invalidType.boolean");
							break;
						case "date":
							message = t("validation.invalidType.date");
							break;
						case "object":
							message = t("validation.invalidType.object");
							break;
						case "array":
							message = t("validation.invalidType.array");
							break;
						default:
							message = t("validation.invalidType.string");
					}
				}
				break;

			case z.ZodIssueCode.invalid_format:
				switch (issue.validation) {
					case "email":
						message = t("validation.invalidString.email");
						break;
					case "url":
						message = t("validation.invalidString.url");
						break;
					case "uuid":
						message = t("validation.invalidString.uuid");
						break;
					case "datetime":
						message = t("validation.invalidString.datetime");
						break;
					case "date":
						message = t("validation.invalidString.date");
						break;
					case "time":
						message = t("validation.invalidString.time");
						break;
					case "ip":
						message = t("validation.invalidString.ip");
						break;
					case "regex":
						message = t("validation.invalidString.regex");
						break;
					default:
						message = t("validation.invalidString.regex");
				}
				break;

			case z.ZodIssueCode.too_small:
				switch (issue.type) {
					case "string":
						message = issue.exact
							? t("validation.tooSmall.string.exact", {
									minimum: issue.minimum,
								})
							: issue.inclusive
								? t("validation.tooSmall.string.inclusive", {
										minimum: issue.minimum,
									})
								: t("validation.tooSmall.string.notInclusive", {
										minimum: issue.minimum,
									});
						break;
					case "number":
						message = issue.exact
							? t("validation.tooSmall.number.exact", {
									minimum: issue.minimum,
								})
							: issue.inclusive
								? t("validation.tooSmall.number.inclusive", {
										minimum: issue.minimum,
									})
								: t("validation.tooSmall.number.notInclusive", {
										minimum: issue.minimum,
									});
						break;
					case "array":
						message = issue.exact
							? t("validation.tooSmall.array.exact", { minimum: issue.minimum })
							: issue.inclusive
								? t("validation.tooSmall.array.inclusive", {
										minimum: issue.minimum,
									})
								: t("validation.tooSmall.array.notInclusive", {
										minimum: issue.minimum,
									});
						break;
					default:
						message = t("validation.required");
				}
				break;

			case z.ZodIssueCode.too_big:
				switch (issue.type) {
					case "string":
						message = issue.exact
							? t("validation.tooBig.string.exact", { maximum: issue.maximum })
							: issue.inclusive
								? t("validation.tooBig.string.inclusive", {
										maximum: issue.maximum,
									})
								: t("validation.tooBig.string.notInclusive", {
										maximum: issue.maximum,
									});
						break;
					case "number":
						message = issue.exact
							? t("validation.tooBig.number.exact", { maximum: issue.maximum })
							: issue.inclusive
								? t("validation.tooBig.number.inclusive", {
										maximum: issue.maximum,
									})
								: t("validation.tooBig.number.notInclusive", {
										maximum: issue.maximum,
									});
						break;
					case "array":
						message = issue.exact
							? t("validation.tooBig.array.exact", { maximum: issue.maximum })
							: issue.inclusive
								? t("validation.tooBig.array.inclusive", {
										maximum: issue.maximum,
									})
								: t("validation.tooBig.array.notInclusive", {
										maximum: issue.maximum,
									});
						break;
					default:
						message = undefined;
				}
				break;

			case z.ZodIssueCode.custom:
				// カスタムエラーメッセージ
				// スキーマ定義側で { message: "validation.custom.article.titleRequired" } のように指定
				if (
					typeof issue.params?.message === "string" &&
					issue.params.message.startsWith("validation.")
				) {
					message = t(issue.params.message);
				} else {
					message = issue.message ?? undefined;
				}
				break;

			default:
				message = undefined;
		}

		return message;
	};
};

/**
 * カスタムメッセージ用のヘルパー関数
 *
 * 使用例:
 * ```typescript
 * const schema = z.string().min(1, i18nMessage("validation.custom.article.titleRequired"));
 * ```
 */
export const i18nMessage = (messageKey: string) => ({
	message: messageKey,
});

/**
 * サーバーサイドでメッセージを取得するヘルパー関数
 *
 * 使用例:
 * ```typescript
 * const errorMap = await createServerZodErrorMap(locale);
 * z.setErrorMap(errorMap);
 * ```
 */
export const createServerZodErrorMap = async (
	locale: Locale
): Promise<z.ZodErrorMap> => {
	// 動的インポートで該当言語のメッセージを読み込む
	const messages = await import(
		`@saneatsu/i18n/src/locales/${locale}.json`
	).then((module) => module.default);

	// ネストしたオブジェクトから値を取得するヘルパー
	const getNestedValue = (obj: unknown, path: string): unknown => {
		return path.split(".").reduce((current, key) => {
			if (current && typeof current === "object" && key in current) {
				return (current as Record<string, unknown>)[key];
			}
			return undefined;
		}, obj);
	};

	// 翻訳関数
	const t = (key: string, values?: Record<string, unknown>): string => {
		const nestedValue = getNestedValue(messages, key);
		let message = typeof nestedValue === "string" ? nestedValue : key;

		// プレースホルダーの置換
		if (values) {
			Object.entries(values).forEach(([placeholder, value]) => {
				message = message.replace(`{${placeholder}}`, String(value));
			});
		}

		return message;
	};

	return makeZodI18nMap(t);
};
