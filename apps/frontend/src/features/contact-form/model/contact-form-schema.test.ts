import { describe, expect, it } from "vitest";

import {
	CONTACT_CATEGORIES,
	type ContactFormValues,
	contactFormSchema,
} from "./contact-form-schema";

/**
 * テスト観点の表（等価分割・境界値）
 *
 * | 分類       | テストケース                     | 期待値           |
 * |-----------|-------------------------------|-----------------|
 * | 正常系     | 全フィールドに有効な値            | success          |
 * | 正常系     | 名前1文字（最小値）              | success          |
 * | 正常系     | 名前100文字（最大値）            | success          |
 * | 正常系     | 会社名1文字（最小値）            | success          |
 * | 正常系     | 会社名100文字（最大値）           | success          |
 * | 正常系     | 役職なし（オプション）            | success          |
 * | 正常系     | 役職あり                        | success          |
 * | 正常系     | 役職空文字                      | success          |
 * | 正常系     | 件名200文字（最大値）            | success          |
 * | 正常系     | メッセージ5000文字（最大値）       | success          |
 * | 正常系     | 全カテゴリ値                    | success          |
 * | 正常系     | ハニーポット空文字               | success          |
 * | 正常系     | ハニーポットundefined            | success          |
 * | 異常系     | 名前空文字                      | error            |
 * | 異常系     | 会社名空文字                    | error            |
 * | 異常系     | メール空文字                    | error            |
 * | 異常系     | メール形式不正                   | error            |
 * | 異常系     | 件名空文字                      | error            |
 * | 異常系     | カテゴリ不正値                   | error            |
 * | 異常系     | メッセージ空文字                 | error            |
 * | 異常系     | ハニーポットに値あり              | error            |
 * | 境界値     | 名前101文字                     | error            |
 * | 境界値     | 会社名101文字                   | error            |
 * | 境界値     | 役職101文字                     | error            |
 * | 境界値     | 件名201文字                     | error            |
 * | 境界値     | メッセージ5001文字               | error            |
 */

/** 有効なフォームデータのベース */
const validFormData: ContactFormValues = {
	name: "テスト太郎",
	company: "テスト株式会社",
	jobTitle: "",
	email: "test@example.com",
	subject: "テスト件名",
	category: "general",
	message: "テストメッセージです。",
	honeypot: "",
};

describe("contactFormSchema", () => {
	describe("Unit Test", () => {
		// --- 正常系 ---
		it("should accept valid form data with all fields", () => {
			// Given: 有効なフォームデータ
			// When: バリデーション
			const result = contactFormSchema.safeParse(validFormData);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept name with 1 character (minimum boundary)", () => {
			// Given: 名前が1文字
			const data = { ...validFormData, name: "あ" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept name with 100 characters (maximum boundary)", () => {
			// Given: 名前が100文字
			const data = { ...validFormData, name: "あ".repeat(100) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept company with 1 character (minimum boundary)", () => {
			// Given: 会社名が1文字
			const data = { ...validFormData, company: "あ" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept company with 100 characters (maximum boundary)", () => {
			// Given: 会社名が100文字
			const data = { ...validFormData, company: "あ".repeat(100) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept empty job title (optional field)", () => {
			// Given: 役職が空文字
			const data = { ...validFormData, jobTitle: "" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept undefined job title (optional field)", () => {
			// Given: 役職がundefined
			const data = { ...validFormData, jobTitle: undefined };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept job title with value", () => {
			// Given: 役職に値がある
			const data = { ...validFormData, jobTitle: "エンジニア" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept subject with 200 characters (maximum boundary)", () => {
			// Given: 件名が200文字
			const data = { ...validFormData, subject: "あ".repeat(200) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept message with 5000 characters (maximum boundary)", () => {
			// Given: メッセージが5000文字
			const data = { ...validFormData, message: "あ".repeat(5000) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept all valid category values", () => {
			// Given: 全カテゴリ値
			for (const category of CONTACT_CATEGORIES) {
				const data = { ...validFormData, category };

				// When: バリデーション
				const result = contactFormSchema.safeParse(data);

				// Then: 成功する
				expect(result.success).toBe(true);
			}
		});

		it("should accept honeypot as empty string", () => {
			// Given: ハニーポットが空文字
			const data = { ...validFormData, honeypot: "" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		it("should accept honeypot as undefined", () => {
			// Given: ハニーポットがundefined
			const data = { ...validFormData, honeypot: undefined };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 成功する
			expect(result.success).toBe(true);
		});

		// --- 異常系 ---
		it("should reject empty name", () => {
			// Given: 名前が空文字
			const data = { ...validFormData, name: "" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("お名前を入力してください");
			}
		});

		it("should reject empty company", () => {
			// Given: 会社名が空文字
			const data = { ...validFormData, company: "" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("会社名を入力してください");
			}
		});

		it("should reject empty email", () => {
			// Given: メールが空文字
			const data = { ...validFormData, email: "" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"メールアドレスを入力してください"
				);
			}
		});

		it("should reject invalid email format", () => {
			// Given: メール形式が不正
			const data = { ...validFormData, email: "invalid-email" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"正しいメールアドレスの形式で入力してください"
				);
			}
		});

		it("should reject empty subject", () => {
			// Given: 件名が空文字
			const data = { ...validFormData, subject: "" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe("件名を入力してください");
			}
		});

		it("should reject invalid category value", () => {
			// Given: 不正なカテゴリ値
			const data = { ...validFormData, category: "invalid-category" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"カテゴリを選択してください"
				);
			}
		});

		it("should reject empty message", () => {
			// Given: メッセージが空文字
			const data = { ...validFormData, message: "" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"メッセージを入力してください"
				);
			}
		});

		it("should reject honeypot with value (spam detection)", () => {
			// Given: ハニーポットに値がある（スパム）
			const data = { ...validFormData, honeypot: "spam-content" };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
		});

		// --- 境界値 ---
		it("should reject name with 101 characters (exceeds maximum)", () => {
			// Given: 名前が101文字
			const data = { ...validFormData, name: "あ".repeat(101) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"お名前は100文字以内で入力してください"
				);
			}
		});

		it("should reject company with 101 characters (exceeds maximum)", () => {
			// Given: 会社名が101文字
			const data = { ...validFormData, company: "あ".repeat(101) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"会社名は100文字以内で入力してください"
				);
			}
		});

		it("should reject job title with 101 characters (exceeds maximum)", () => {
			// Given: 役職が101文字
			const data = { ...validFormData, jobTitle: "あ".repeat(101) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"役職は100文字以内で入力してください"
				);
			}
		});

		it("should reject subject with 201 characters (exceeds maximum)", () => {
			// Given: 件名が201文字
			const data = { ...validFormData, subject: "あ".repeat(201) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"件名は200文字以内で入力してください"
				);
			}
		});

		it("should reject message with 5001 characters (exceeds maximum)", () => {
			// Given: メッセージが5001文字
			const data = { ...validFormData, message: "あ".repeat(5001) };

			// When: バリデーション
			const result = contactFormSchema.safeParse(data);

			// Then: 失敗する
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toBe(
					"メッセージは5000文字以内で入力してください"
				);
			}
		});
	});
});
