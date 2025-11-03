import { expect, test } from "@playwright/test";

/**
 * Wiki Link機能のE2Eテスト
 *
 * @description
 * 記事エディターでのWiki Link機能（[[slug]]形式）の動作をテストする。
 * サジェスト表示、キーボードナビゲーション、リンク挿入、プレビュー表示を確認する。
 */
test.describe("Wiki Link機能", () => {
	test.beforeEach(async ({ page }) => {
		// ログイン処理
		await page.goto("http://localhost:3333/login");
		await page.fill('input[name="email"]', "nito.tech.official@gmail.com");
		await page.fill('input[name="password"]', "Password123!");
		await page.click('button[type="submit"]');

		// 記事作成ページへ遷移
		await page.goto("http://localhost:3333/admin/articles/new");
		await page.waitForSelector(".w-md-editor");
	});

	test("[[入力時にサジェストポップオーバーが表示される", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// [[を入力
		await textarea.fill("[[");

		// サジェストポップオーバーが表示されることを確認
		await expect(
			page.locator('[data-testid="wiki-link-suggestions"]')
		).toBeVisible();
	});

	test("サジェストでキーボードナビゲーションが動作する", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// [[を入力
		await textarea.fill("[[");

		// サジェストポップオーバーが表示されるまで待機
		await expect(
			page.locator('[data-testid="wiki-link-suggestions"]')
		).toBeVisible();

		// 最初のアイテムがハイライトされていることを確認
		const firstItem = page
			.locator('[data-testid="wiki-link-suggestion-item"]')
			.first();
		await expect(firstItem).toHaveAttribute("data-highlighted", "true");

		// 下矢印キーで次のアイテムへ移動
		await page.keyboard.press("ArrowDown");

		// 2番目のアイテムがハイライトされていることを確認
		const secondItem = page
			.locator('[data-testid="wiki-link-suggestion-item"]')
			.nth(1);
		await expect(secondItem).toHaveAttribute("data-highlighted", "true");

		// 上矢印キーで前のアイテムへ戻る
		await page.keyboard.press("ArrowUp");

		// 最初のアイテムが再びハイライトされていることを確認
		await expect(firstItem).toHaveAttribute("data-highlighted", "true");
	});

	test("Enterキーでサジェストアイテムを選択できる", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// [[を入力
		await textarea.fill("[[");

		// サジェストポップオーバーが表示されるまで待機
		await expect(
			page.locator('[data-testid="wiki-link-suggestions"]')
		).toBeVisible();

		// Enterキーで選択
		await page.keyboard.press("Enter");

		// サジェストが閉じることを確認
		await expect(
			page.locator('[data-testid="wiki-link-suggestions"]')
		).not.toBeVisible();

		// テキストにWiki Linkが挿入されていることを確認（具体的なslugは環境依存）
		const value = await textarea.inputValue();
		expect(value).toMatch(/\[\[.+\]\]/);
	});

	test("Escapeキーでサジェストを閉じることができる", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// [[を入力
		await textarea.fill("[[");

		// サジェストポップオーバーが表示されるまで待機
		await expect(
			page.locator('[data-testid="wiki-link-suggestions"]')
		).toBeVisible();

		// Escapeキーでサジェストを閉じる
		await page.keyboard.press("Escape");

		// サジェストが閉じることを確認
		await expect(
			page.locator('[data-testid="wiki-link-suggestions"]')
		).not.toBeVisible();

		// テキストは[[のままであることを確認
		await expect(textarea).toHaveValue("[[");
	});

	test("見出し付きWiki Linkを選択できる", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// [[を入力
		await textarea.fill("[[");

		// サジェストポップオーバーが表示されるまで待機
		await expect(
			page.locator('[data-testid="wiki-link-suggestions"]')
		).toBeVisible();

		// 見出し付きのアイテムがある場合は選択
		const headingItem = page
			.locator('[data-testid="wiki-link-suggestion-item"]')
			.filter({
				hasText: "#",
			})
			.first();

		if ((await headingItem.count()) > 0) {
			await headingItem.click();

			// 見出し付きWiki Linkが挿入されていることを確認
			const value = await textarea.inputValue();
			expect(value).toMatch(/\[\[.+#.+\]\]/);
		}
	});

	test("Wiki Linkの括弧ペア削除が動作する", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// [[]]を入力
		await textarea.fill("[[]]");

		// カーソルを最後の]の後に配置
		await textarea.click();
		await page.keyboard.press("End");

		// Backspaceで最後の]を削除
		await page.keyboard.press("Backspace");

		// []が残ることを確認（対応する括弧ペアが削除される）
		await expect(textarea).toHaveValue("[]");
	});

	test("プレビューでWiki Linkがリンクとして表示される", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// 記事タイトルとWiki Linkを含むコンテンツを入力
		await page.fill('input[name="title"]', "テスト記事");
		await textarea.fill("これは[[test-article]]へのリンクです。");

		// プレビュータブに切り替え（MDEditorのプレビュータブを選択）
		await page.click('.w-md-editor-tab[data-name="preview"]');

		// プレビューでWiki Linkがリンクとして表示されることを確認
		const previewContent = page.locator(".w-md-editor-preview");
		await expect(
			previewContent.locator('a[href*="test-article"]')
		).toBeVisible();
	});

	test("存在しない記事のWiki Linkでエラー表示される", async ({ page }) => {
		// MDEditorのtextareaを取得
		const textarea = await page.locator(".w-md-editor-text-input");

		// 存在しない記事へのWiki Linkを入力
		await page.fill('input[name="title"]', "テスト記事");
		await textarea.fill("これは[[non-existent-article]]へのリンクです。");

		// プレビュータブに切り替え（MDEditorのプレビュータブを選択）
		await page.click('.w-md-editor-tab[data-name="preview"]');

		// プレビューでエラー表示されることを確認
		const previewContent = page.locator(".w-md-editor-preview");
		await expect(previewContent).toContainText("記事が見つかりません");
	});
});
