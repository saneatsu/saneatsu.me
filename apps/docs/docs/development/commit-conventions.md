---
sidebar_position: 2
---

# コミット規約

プロジェクトでは[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/)に従ったコミットメッセージを使用します。

## 基本構造

```
<Type>(Optional Scope): <Subject>

<optional Body>

<optional Footer>
```

## Type（必須）

変更の種類を表します：

| Type | 説明 | 例 |
|------|------|-----|
| `feat` | 新機能の追加 | `feat: ユーザー認証機能を追加` |
| `fix` | バグ修正 | `fix: ログイン時のリダイレクトエラーを修正` |
| `docs` | ドキュメントのみの変更 | `docs: READMEにインストール手順を追加` |
| `style` | コードの動作に影響しないフォーマット変更 | `style: インデントを修正` |
| `refactor` | バグ修正や機能追加を含まないリファクタリング | `refactor: 認証ロジックを別モジュールに分離` |
| `perf` | パフォーマンス改善 | `perf: 画像の遅延読み込みを実装` |
| `test` | テストの追加や修正 | `test: ユーザー登録のE2Eテストを追加` |
| `build` | ビルドシステムや外部依存関係の変更 | `build: webpackの設定を更新` |
| `ci` | CI設定の変更 | `ci: GitHub Actionsのワークフローを追加` |
| `chore` | その他の変更（コードやテストに影響しない） | `chore: 依存関係を更新` |
| `revert` | コミットの取り消し | `revert: "feat: ユーザー認証機能を追加"` |

## Scope（オプション）

変更の影響範囲を示します：

- `auth` - 認証関連
- `api` - API関連
- `ui` - ユーザーインターフェース
- `config` - 設定ファイル
- `deps` - 依存関係
- `docs` - ドキュメント
- `build` - ビルドシステム
- `ci` - 継続的インテグレーション
- `lang` - 国際化
- `tests` - テスト
- `styles` - スタイル
- `scripts` - スクリプト
- `components` - コンポーネント
- `services` - サービス
- `utils` - ユーティリティ

### 使用例

```
feat(auth): Add JWT token refresh
fix(api): Resolve CORS issue for article endpoints
docs(components): Update Button component documentation
```

## Subject（必須）

変更内容の簡潔な要約：

- **必ず大文字で始める**
- 100文字以内に収める
- 命令形で記述する
- ピリオドで終わらない

### 良い例と悪い例

```bash
# ✅ 良い例
feat: Add user profile page
fix: Resolve memory leak in article list
docs: Update API endpoint documentation

# ❌ 悪い例
feat: added user profile page  # 過去形
fix: fixes memory leak.        # ピリオドあり
docs: updated docs            # 小文字始まり
```

## Body（オプション）

詳細な説明が必要な場合に使用：

- Subjectの1行空けて記述
- 変更の理由や背景を説明
- 複数段落も可能

```
feat: Add user notification system

Implement real-time notifications using WebSocket connection.
This allows users to receive instant updates about new comments
and likes on their articles.

The implementation includes:
- WebSocket server setup
- Client-side notification handler
- Notification preferences in user settings
```

## Footer（オプション）

追加情報や破壊的変更の記載：

```
feat: Migrate to new authentication system

BREAKING CHANGE: The old auth tokens are no longer valid.
Users will need to log in again after this update.

Refs: #123
Reviewed-by: @reviewer
```

## 破壊的変更

破壊的変更がある場合の記法：

### 1. Footerに記載

```
feat: Change API response format

BREAKING CHANGE: API responses now use camelCase instead of snake_case
```

### 2. Type に `!` を追加

```
feat!: Remove deprecated endpoints
```

### 3. Scopeがある場合

```
feat(api)!: Change authentication method
```

## 実践例

### 新機能追加

```
feat(articles): Add markdown preview feature

Users can now preview their markdown content in real-time
while writing articles. This improves the writing experience
and helps catch formatting issues early.
```

### バグ修正

```
fix(auth): Prevent duplicate login attempts

Multiple rapid clicks on the login button were causing
duplicate API requests. Added debouncing to prevent this.

Fixes: #456
```

### リファクタリング

```
refactor(components): Extract common form logic

Created a custom hook useFormValidation to handle
common form validation logic across multiple components.
This reduces code duplication and improves maintainability.
```

### 破壊的変更を含む更新

```
feat(api)!: Update article schema

BREAKING CHANGE: The 'author' field is now 'authorId' and
returns only the ID instead of the full user object.
This improves API performance but requires frontend updates.

Migration guide:
1. Update all references from article.author.id to article.authorId
2. Fetch author details separately if needed
```

## コミット前のチェックリスト

1. **ステージングされたファイルを確認**
   ```bash
   git diff --staged
   ```

2. **コミットメッセージの形式を確認**
   - Typeは正しいか？
   - Subjectは大文字で始まっているか？
   - 英語で記述されているか？

3. **コードの品質を確認**
   ```bash
   pnpm type-check
   pnpm check
   ```

## よくある間違い

### 1. 複数の変更を1つのコミットに含める

```bash
# ❌ 悪い例
feat: Add login feature and fix navigation bug

# ✅ 良い例（別々のコミットに分ける）
feat(auth): Add login feature
fix(navigation): Resolve routing error
```

### 2. 曖昧な説明

```bash
# ❌ 悪い例
fix: Fix bug
chore: Update stuff

# ✅ 良い例
fix(articles): Resolve image loading error on Safari
chore(deps): Update React to v18.2.0
```

### 3. 長すぎるSubject

```bash
# ❌ 悪い例
feat: Add new feature that allows users to upload multiple images at once and automatically resize them for optimal performance

# ✅ 良い例
feat: Add bulk image upload with auto-resize

Support for uploading multiple images simultaneously.
Images are automatically resized for optimal performance
before storage.
```

## Git Hooksとの連携

プロジェクトではcommitlintを使用してコミットメッセージを自動検証します。不正な形式の場合、コミットは拒否されます。

```bash
# コミット時に自動的にチェックされる
git commit -m "bad message"  # ❌ 拒否される
git commit -m "feat: Add new feature"  # ✅ 受け入れられる
```