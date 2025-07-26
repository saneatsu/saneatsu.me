---
sidebar_position: 4
---

# Playwright E2Eテストガイド

PlaywrightによるEnd-to-End（E2E）テストの作成方法について説明します。

## 基本的な使い方

### テストファイルの配置

E2Eテストは `e2e/` ディレクトリに配置します：

```
e2e/
  articles.spec.ts    # 記事関連のE2Eテスト
  auth.spec.ts        # 認証関連のE2Eテスト
  navigation.spec.ts  # ナビゲーション関連のE2Eテスト
```

### 基本的なテスト構造

```typescript
import { test, expect } from '@playwright/test';

test.describe('記事閲覧機能', () => {
  test('記事一覧が表示される', async ({ page }) => {
    // ページに遷移
    await page.goto('/articles');
    
    // タイトルを確認
    await expect(page).toHaveTitle(/記事一覧/);
    
    // 記事が存在することを確認
    const articles = page.locator('article');
    await expect(articles).toHaveCount(10); // 10件表示
  });

  test('記事詳細が表示される', async ({ page }) => {
    await page.goto('/articles');
    
    // 最初の記事をクリック
    await page.locator('article').first().click();
    
    // 記事詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/articles\/.+/);
    
    // 記事タイトルが表示されている
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## セレクターの使用

### 推奨されるセレクター（優先順）

```typescript
// 1. ロールベースのセレクター
await page.getByRole('button', { name: '送信' }).click();
await page.getByRole('textbox', { name: 'メールアドレス' }).fill('test@example.com');

// 2. ラベルテキスト
await page.getByLabel('パスワード').fill('password123');

// 3. プレースホルダー
await page.getByPlaceholder('検索...').fill('キーワード');

// 4. テキスト
await page.getByText('ログイン').click();

// 5. テストID（最終手段）
await page.getByTestId('submit-button').click();
```

### 複雑なセレクター

```typescript
// 複数の条件を組み合わせる
await page.locator('article').filter({ hasText: 'TypeScript' }).click();

// 階層的な選択
await page.locator('nav').getByRole('link', { name: 'ホーム' }).click();

// nth-child的な選択
await page.locator('li').nth(2).click();
```

## 認証のテスト

### ログイン機能

```typescript
test.describe('認証機能', () => {
  test('正常にログインできる', async ({ page }) => {
    await page.goto('/login');
    
    // フォームに入力
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード').fill('password123');
    
    // ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard');
    
    // ユーザー名が表示されている
    await expect(page.getByText('ようこそ、テストユーザーさん')).toBeVisible();
  });

  test('無効な認証情報でエラーが表示される', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('メールアドレス').fill('wrong@example.com');
    await page.getByLabel('パスワード').fill('wrongpassword');
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // エラーメッセージが表示される
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible();
  });
});
```

### 認証状態の保持

```typescript
// グローバルセットアップでログイン状態を保存
// playwright.config.ts
export default defineConfig({
  use: {
    storageState: 'playwright/.auth/user.json',
  },
});

// global-setup.ts
import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // ログイン処理
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill('test@example.com');
  await page.getByLabel('パスワード').fill('password123');
  await page.getByRole('button', { name: 'ログイン' }).click();
  
  // 認証状態を保存
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  await browser.close();
}

export default globalSetup;
```

## APIモック

### レスポンスのモック

```typescript
test('APIエラー時の表示', async ({ page }) => {
  // APIレスポンスをモック
  await page.route('**/api/articles', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'SERVER_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      }),
    });
  });

  await page.goto('/articles');
  
  // エラーメッセージが表示される
  await expect(page.getByText('エラーが発生しました')).toBeVisible();
});
```

### ネットワークの遅延シミュレーション

```typescript
test('ローディング状態の確認', async ({ page }) => {
  // 3秒の遅延を追加
  await page.route('**/api/articles', async route => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await route.continue();
  });

  await page.goto('/articles');
  
  // ローディング表示を確認
  await expect(page.getByText('読み込み中...')).toBeVisible();
  
  // データが表示されるまで待機
  await expect(page.locator('article')).toBeVisible({ timeout: 5000 });
});
```

## ビジュアルリグレッションテスト

### スクリーンショットの比較

```typescript
test('ホームページの見た目が変わっていない', async ({ page }) => {
  await page.goto('/');
  
  // フルページのスクリーンショット
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
  });
});

test('ボタンのホバー状態', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: '始める' });
  
  // ホバー状態のスクリーンショット
  await button.hover();
  await expect(button).toHaveScreenshot('button-hover.png');
});
```

## モバイルテスト

### デバイスエミュレーション

```typescript
import { devices } from '@playwright/test';

test.use({
  ...devices['iPhone 13'],
});

test('モバイル表示でメニューが動作する', async ({ page }) => {
  await page.goto('/');
  
  // ハンバーガーメニューが表示されている
  const menuButton = page.getByLabel('メニューを開く');
  await expect(menuButton).toBeVisible();
  
  // メニューを開く
  await menuButton.click();
  
  // メニュー項目が表示される
  await expect(page.getByRole('navigation')).toBeVisible();
});
```

## 高度なテクニック

### ページオブジェクトモデル

```typescript
// page-objects/ArticlePage.ts
export class ArticlePage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/articles');
  }
  
  async searchArticles(keyword: string) {
    await this.page.getByPlaceholder('記事を検索').fill(keyword);
    await this.page.getByRole('button', { name: '検索' }).click();
  }
  
  async openArticle(title: string) {
    await this.page.getByRole('heading', { name: title }).click();
  }
}

// テストでの使用
test('記事検索機能', async ({ page }) => {
  const articlePage = new ArticlePage(page);
  
  await articlePage.goto();
  await articlePage.searchArticles('TypeScript');
  await articlePage.openArticle('TypeScript入門');
  
  await expect(page).toHaveURL(/typescript-introduction/);
});
```

### データ駆動テスト

```typescript
const testData = [
  { lang: 'ja', expectedTitle: '記事一覧' },
  { lang: 'en', expectedTitle: 'Articles' },
];

for (const { lang, expectedTitle } of testData) {
  test(`${lang}言語で正しいタイトルが表示される`, async ({ page }) => {
    await page.goto(`/${lang}/articles`);
    await expect(page).toHaveTitle(new RegExp(expectedTitle));
  });
}
```

## 実行とデバッグ

### テスト実行コマンド

```bash
# すべてのE2Eテストを実行
pnpm e2e

# 特定のファイルのテストを実行
pnpm e2e articles.spec.ts

# UIモードで実行（デバッグに便利）
pnpm e2e:ui

# ヘッドレスモードで実行
pnpm e2e --headed

# 特定のブラウザで実行
pnpm e2e --project=chromium
pnpm e2e --project=firefox
pnpm e2e --project=webkit
```

### デバッグ方法

```typescript
// ブレークポイントを設定
await page.pause();

// デバッグ情報を出力
console.log(await page.title());
console.log(await page.url());

// スクリーンショットを保存
await page.screenshot({ path: 'debug.png' });

// HTMLを保存
const html = await page.content();
console.log(html);
```

## CI/CDでの実行

### GitHub Actions設定

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
      - run: pnpm e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## ベストプラクティス

1. **テストの独立性**: 各テストは他のテストに依存しない
2. **明確な命名**: 日本語で何をテストしているか明確に記述
3. **適切な待機**: 固定のsleepではなく、要素の表示を待つ
4. **エラーハンドリング**: 期待されるエラーも含めてテスト
5. **クリーンアップ**: テスト後はデータをクリーンな状態に戻す