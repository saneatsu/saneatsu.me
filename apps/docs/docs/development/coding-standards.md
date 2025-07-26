---
sidebar_position: 1
---

# コーディング規約

saneatsu.meプロジェクトのコーディング規約です。一貫性のあるコードベースを維持するために、これらのガイドラインに従ってください。

## 基本原則

### YAGNI (You Aren't Gonna Need It)
- 今必要じゃない機能は作らない
- 将来使うかもしれない機能は実装しない

### DRY (Don't Repeat Yourself)
- 同じコードを繰り返さない
- 重複コードは必ず関数化・モジュール化する

### KISS (Keep It Simple Stupid)
- 複雑な解決策より単純な解決策を優先する
- 読みやすく理解しやすいコードを書く

### 単一責任原則
- 関数やコンポーネントは単一の責任を持つ
- 公開APIは最小限にする

## TypeScriptの規約

### 型定義

```typescript
// ❌ 悪い例：any型の使用
const processData = (data: any) => { /* ... */ };

// ✅ 良い例：適切な型定義
interface UserData {
  id: number;
  name: string;
  email: string;
}
const processData = (data: UserData) => { /* ... */ };
```

### 命名規則

```typescript
// DBやメモリから取得する処理
async function getUser(id: number): Promise<User> {
  // データベースから取得
}

// 外部APIリクエストによる処理
async function fetchWeatherData(city: string): Promise<Weather> {
  // APIリクエスト
}
```

## ディレクトリ構造（Feature-Sliced Design）

```
src/
├── app/           # アプリケーション層
├── views/         # ビュー層（旧Pages）
├── widgets/       # ウィジェット層
├── features/      # フィーチャー層
├── entities/      # エンティティ層
└── shared/        # 共有層
```

各層の詳細は[アーキテクチャドキュメント](/docs/architecture/feature-sliced-design)を参照してください。

## コンポーネントの実装

### ファイル名とディレクトリ名

- ケバブケースで命名する
- コロケーションを意識して関連ファイルは近くに配置

```
src/shared/ui/button/
  button.tsx        # コンポーネント
  button.test.tsx   # テスト
  button.stories.tsx # Storybook
  index.ts          # エクスポート
```

### コンポーネントの構造

```typescript
import { type FC } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

/**
 * 汎用的なボタンコンポーネント
 * 
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   送信
 * </Button>
 */
export const Button: FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

## フォームの実装

### React Hook FormとZodの使用

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// バリデーションスキーマ
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    // 送信処理
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <FormError>{errors.email.message}</FormError>}
      
      <input {...register('password')} type="password" />
      {errors.password && <FormError>{errors.password.message}</FormError>}
      
      <button type="submit">ログイン</button>
    </form>
  );
}
```

## スタイリング

### Tailwind CSSの使用

```typescript
// shadcn/uiのコンポーネントを優先的に使用
import { Button } from '@/shared/ui/button';

// カスタムスタイルが必要な場合
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-lg font-semibold text-gray-900">タイトル</h2>
  <Button variant="outline" size="sm">
    編集
  </Button>
</div>
```

### レスポンシブデザイン

```typescript
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* モバイル: 1列、タブレット: 2列、デスクトップ: 3列 */}
</div>
```

## 国際化対応

### next-intlの使用

```typescript
import { useTranslations } from 'next-intl';

export function ArticleCard() {
  const t = useTranslations('ArticleCard');
  
  return (
    <div>
      <h3>{t('title')}</h3>
      <p>{t('readMore')}</p>
    </div>
  );
}
```

翻訳ファイル:
```json
// messages/ja/ArticleCard.json
{
  "title": "記事タイトル",
  "readMore": "続きを読む"
}
```

## エラーハンドリング

### ユーザーフレンドリーなエラーメッセージ

```typescript
try {
  await saveArticle(data);
} catch (error) {
  // ユーザーに行動を促すメッセージ
  toast.error('記事の保存に失敗しました。もう一度お試しください。');
  
  // 開発環境ではエラーの詳細をログ出力
  if (process.env.NODE_ENV === 'development') {
    console.error('Article save error:', error);
  }
}
```

## コメントとドキュメント

### TSDocコメント

```typescript
/**
 * 記事一覧を取得する
 * 
 * 処理の流れ：
 * 1. クエリパラメータをパース
 * 2. キャッシュをチェック
 * 3. キャッシュがない場合はAPIから取得
 * 4. レスポンスを整形して返す
 * 
 * @param params - クエリパラメータ
 * @param params.page - ページ番号（デフォルト: 1）
 * @param params.limit - 1ページあたりの件数（デフォルト: 10）
 * @returns 記事一覧とページネーション情報
 */
export async function getArticles(params: ArticleQueryParams) {
  // 1. クエリパラメータをパース
  const { page = 1, limit = 10 } = params;
  
  // 2. キャッシュをチェック
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // 3. APIから取得
  const response = await api.articles.list({ page, limit });
  
  // 4. レスポンスを整形
  return formatArticleResponse(response);
}
```

### インラインコメント

```typescript
// コメントは「なぜ」を説明する
// ❌ 悪い例：何をしているかを説明
// ユーザーIDを取得
const userId = getUserId();

// ✅ 良い例：なぜそうしているかを説明
// 古いAPIとの互換性のため、ユーザーIDを文字列に変換
const userId = String(getUserId());
```

## リファクタリング

### テストファーストアプローチ

1. テストが書かれていないコードはリファクタリングしない
2. まずテストを書いてから、リファクタリングを行う
3. 小さなステップで進める

### Tidyingsパターン

```typescript
// Before: 長いメソッド
function processOrder(order: Order) {
  // 在庫チェック
  // 価格計算
  // 割引適用
  // 注文確定
  // メール送信
}

// After: 責任を分離
function processOrder(order: Order) {
  validateInventory(order);
  const price = calculatePrice(order);
  const finalPrice = applyDiscounts(price, order);
  confirmOrder(order, finalPrice);
  sendConfirmationEmail(order);
}
```

## セキュリティベストプラクティス

### 機密情報の扱い

```typescript
// ❌ 悪い例：機密情報をコードに直接記載
const API_KEY = 'sk-1234567890abcdef';

// ✅ 良い例：環境変数から取得
const API_KEY = process.env.API_KEY;

// ❌ 悪い例：機密情報をログ出力
console.log('User data:', { email, password });

// ✅ 良い例：機密情報を除外
console.log('User data:', { email });
```

## チェックリスト

コミット前に以下を確認：

- [ ] `pnpm type-check` でTypeScriptエラーがない
- [ ] `pnpm check` でBiomeエラーがない
- [ ] テストが追加/更新されている
- [ ] TSDocコメントが追加されている（複雑な関数の場合）
- [ ] 機密情報がハードコードされていない
- [ ] 適切なエラーハンドリングが実装されている