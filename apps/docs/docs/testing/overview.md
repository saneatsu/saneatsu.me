---
sidebar_position: 1
---

# テスト概要

saneatsu.meプロジェクトでは、コードの品質と信頼性を確保するために、包括的なテスト戦略を採用しています。

## テストピラミッド

プロジェクトでは[Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)のアプローチを採用し、結合テストを厚めにしています：

```
      🏆
    /     \
   /  E2E  \
  /_________\
 /           \
/  Integration \
/_______________\
/               \
/     Unit       \
/_________________\
```

## テストツール

### 1. Vitest（単体テスト・結合テスト）

- 高速なテスト実行
- TypeScriptのネイティブサポート
- React Testing Libraryとの統合
- カバレッジレポート

### 2. Storybook（コンポーネントテスト）

- UIコンポーネントの視覚的なテスト
- インタラクションテスト（play関数）
- アクセシビリティチェック
- バリデーションテスト

### 3. Playwright（E2Eテスト）

- ブラウザ自動化テスト
- クロスブラウザ対応
- 視覚的なデバッグツール
- CI/CD統合

## テスト実行コマンド

```bash
# すべてのテストを実行
pnpm test

# Vitestのテストのみ実行
pnpm test:unit

# Storybookのテストのみ実行
cd apps/web && pnpm test -- --project=storybook

# Playwrightのテストのみ実行
pnpm e2e

# テストカバレッジを確認
pnpm test:coverage
```

## テスト作成のガイドライン

### 1. テストファイルの配置

- **単体テスト**: `[filename].test.ts(x)` - テスト対象ファイルと同じディレクトリ
- **Storybook**: `[component].stories.tsx` - コンポーネントと同じディレクトリ
- **E2Eテスト**: `e2e/[feature].spec.ts` - e2eディレクトリ内

### 2. テストの命名規則

```typescript
// 単体テスト
describe('ComponentName', () => {
  describe('Unit Test', () => {
    it('should render correctly', () => {
      // テストコード
    });
  });

  describe('Integration Test', () => {
    it('should handle user interaction', () => {
      // テストコード
    });
  });
});

// Storybook
export const Default: Story = {
  name: 'デフォルト表示',
  // ...
};

// E2E
test('ユーザーが記事を閲覧できる', async ({ page }) => {
  // テストコード
});
```

### 3. テストの優先順位

1. **高優先度**: ユーザーストーリーの主要なパス
2. **中優先度**: エッジケースとエラーハンドリング
3. **低優先度**: 内部実装の詳細

## ベストプラクティス

### 1. 外部から観測可能な動作をテストする

```typescript
// ❌ 悪い例：内部実装をテスト
expect(component.state.isOpen).toBe(true);

// ✅ 良い例：ユーザーの視点でテスト
expect(screen.getByRole('dialog')).toBeVisible();
```

### 2. テストの独立性を保つ

```typescript
// 各テストの前後でクリーンアップ
beforeEach(() => {
  // セットアップ
});

afterEach(() => {
  // クリーンアップ
});
```

### 3. 適切なテストデータを使用

```typescript
// Factoryパターンでテストデータを生成
const article = createArticleFactory({
  title: 'テスト記事',
  status: 'published',
});
```

### 4. アクセシビリティを考慮

```typescript
// aria属性やロールでの要素取得を優先
const button = screen.getByRole('button', { name: '送信' });
const input = screen.getByLabelText('メールアドレス');
```

## CI/CDでのテスト実行

GitHubアクションでプルリクエスト時に自動実行：

1. 型チェック（TypeScript）
2. リント（Biome）
3. 単体テスト（Vitest）
4. Storybookテスト
5. E2Eテスト（Playwright）

すべてのテストが成功しない限り、マージは許可されません。