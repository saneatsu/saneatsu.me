import { test } from "@playwright/test";

/**
 * ログイン機能のデバッグテスト
 */
test.describe("ログイン機能デバッグ", () => {
	test("ログインページの構造を確認", async ({ page }) => {
		// 直接ログインページにアクセス
		await page.goto("http://localhost:3333/login");

		// ページのタイトルを確認
		console.log("Page title:", await page.title());
		console.log("Current URL:", page.url());

		// ページの内容をダンプ
		const pageContent = await page.content();
		console.log("Page content length:", pageContent.length);

		// すべてのinput要素を確認
		const allInputs = await page.locator("input").all();
		console.log("Total input elements:", allInputs.length);

		for (let i = 0; i < allInputs.length; i++) {
			const input = allInputs[i];
			const type = await input.getAttribute("type");
			const name = await input.getAttribute("name");
			const id = await input.getAttribute("id");
			const placeholder = await input.getAttribute("placeholder");
			console.log(
				`Input ${i}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`
			);
		}

		// すべてのbutton要素を確認
		const allButtons = await page.locator("button").all();
		console.log("Total button elements:", allButtons.length);

		for (let i = 0; i < allButtons.length; i++) {
			const button = allButtons[i];
			const type = await button.getAttribute("type");
			const text = await button.textContent();
			console.log(`Button ${i}: type="${type}", text="${text}"`);
		}

		// フォーム要素を確認
		const forms = await page.locator("form").all();
		console.log("Total form elements:", forms.length);
	});

	test("ログイン処理をテスト", async ({ page }) => {
		// ログインページに直接アクセス
		await page.goto("http://localhost:3333/login");

		// ログイン情報を入力
		await page.fill('input[name="email"]', "test@example.com");
		await page.fill('input[name="password"]', "password123");
		await page.click('button[type="submit"]');

		// ログイン後のページを確認
		await page.waitForURL("**", { timeout: 10000 });
		console.log("After login URL:", page.url());

		// ダッシュボードまたは管理画面に遷移しているかを確認
		const currentUrl = page.url();
		const isLoggedIn =
			currentUrl.includes("/admin") || currentUrl.includes("/dashboard");

		console.log("Is logged in:", isLoggedIn);

		if (isLoggedIn) {
			console.log("ログイン成功");
		} else {
			// エラーメッセージがあるかを確認
			const errorMessage = await page
				.locator('.error, .alert, [role="alert"]')
				.textContent();
			console.log("Error message:", errorMessage);
		}
	});
});
