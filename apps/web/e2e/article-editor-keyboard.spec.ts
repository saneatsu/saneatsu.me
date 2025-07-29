import { expect, test } from "@playwright/test";

/**
 * 記事エディタのキーボードショートカットテスト
 *
 * @description
 * MDEditorのキーボードショートカット動作をテストする。
 * 特にCtrl+Hが水平線挿入ではなくBackspace相当の動作をすることを確認する。
 */
test.describe("記事エディタのキーボードショートカット", () => {
	test.beforeEach(async ({ page }) => {
		// ログイン処理
		await page.goto("http://localhost:3333/login");
		await page.fill('input[name="email"]', "test@example.com");
		await page.fill('input[name="password"]', "password123");
		await page.click('button[type="submit"]');

		// 記事作成ページへ遷移
		await page.goto("http://localhost:3333/admin/articles/new");
		await page.waitForSelector(".w-md-editor");
	});

	test("Ctrl+Hで文字が削除される（Backspace相当の動作）", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// テキストを入力
		await textarea.fill("Hello World");

		// カーソルを最後に移動
		await textarea.click();
		await page.keyboard.press("End");

		// Ctrl+Hを押下
		await page.keyboard.press("Control+h");

		// 文字が削除されることを確認（"d"が削除されて"Hello Worl"になる）
		await expect(textarea).toHaveValue("Hello Worl");

		// 水平線（---）が挿入されていないことを確認
		const value = await textarea.inputValue();
		expect(value).not.toContain("---");
	});

	test("Ctrl+Hで選択範囲が削除される", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// テキストを入力
		await textarea.fill("Hello World");

		// "World"を選択
		await textarea.click();
		await page.keyboard.press("Control+a"); // 全選択
		await page.keyboard.press("Home"); // 先頭へ
		await page.keyboard.press("Control+Shift+Right"); // 単語選択
		await page.keyboard.press("Control+Shift+Right"); // 次の単語も選択

		// Ctrl+Hを押下
		await page.keyboard.press("Control+h");

		// 選択範囲が削除されることを確認
		await expect(textarea).toHaveValue("");

		// 水平線（---）が挿入されていないことを確認
		const value = await textarea.inputValue();
		expect(value).not.toContain("---");
	});

	test("Ctrl+Hでカーソルが先頭の場合は何も削除されない", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// テキストを入力
		await textarea.fill("Hello World");

		// カーソルを先頭に移動
		await textarea.click();
		await page.keyboard.press("Home");

		// Ctrl+Hを押下
		await page.keyboard.press("Control+h");

		// テキストが変更されないことを確認
		await expect(textarea).toHaveValue("Hello World");
	});

	test("通常のBackspaceキーは正常に動作する", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// テキストを入力
		await textarea.fill("Hello World");

		// カーソルを最後に移動
		await textarea.click();
		await page.keyboard.press("End");

		// Backspaceを押下
		await page.keyboard.press("Backspace");

		// 文字が削除されることを確認
		await expect(textarea).toHaveValue("Hello Worl");
	});
});
