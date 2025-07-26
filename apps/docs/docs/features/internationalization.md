---
sidebar_position: 1
---

# 国際化対応（i18n）

saneatsu.meプロジェクトでは、[next-intl](https://next-intl-docs.vercel.app/)を使用して多言語対応を実装しています。

## 対応言語

- 日本語（ja） - デフォルト
- 英語（en）

## 基本的な使い方

### クライアントコンポーネントでの使用

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function ArticleCard() {
  const t = useTranslations('ArticleCard');
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold">{t('title')}</h3>
      <p className="text-gray-600">{t('description')}</p>
      <button className="mt-2 text-blue-500">
        {t('readMore')}
      </button>
    </div>
  );
}
```

### サーバーコンポーネントでの使用

```typescript
import { getTranslations } from 'next-intl/server';

export async function ArticlePage() {
  const t = await getTranslations('ArticlePage');
  
  return (
    <div>
      <h1>{t('pageTitle')}</h1>
      <p>{t('welcome')}</p>
    </div>
  );
}
```

## 翻訳ファイルの構造

翻訳ファイルは `packages/i18n/src/messages/` に配置されています：

```
packages/i18n/src/messages/
├── ja/
│   ├── common.json
│   ├── ArticleCard.json
│   └── ArticlePage.json
└── en/
    ├── common.json
    ├── ArticleCard.json
    └── ArticlePage.json
```

### 翻訳ファイルの例

```json
// packages/i18n/src/messages/ja/ArticleCard.json
{
  "title": "記事タイトル",
  "description": "記事の概要がここに表示されます",
  "readMore": "続きを読む",
  "publishedAt": "{date, date, long}に公開",
  "readingTime": "読了時間：{minutes}分"
}

// packages/i18n/src/messages/en/ArticleCard.json
{
  "title": "Article Title",
  "description": "Article summary will be displayed here",
  "readMore": "Read more",
  "publishedAt": "Published on {date, date, long}",
  "readingTime": "Reading time: {minutes} minutes"
}
```

## 動的な値の挿入

### 変数の挿入

```typescript
const t = useTranslations('Article');

// 翻訳ファイル: "welcome": "こんにちは、{name}さん！"
return <p>{t('welcome', { name: 'ずんだもん' })}</p>;
// 出力: こんにちは、ずんだもんさん！
```

### 日付のフォーマット

```typescript
const t = useTranslations('Article');
const publishedDate = new Date('2024-01-15');

// 翻訳ファイル: "publishedAt": "{date, date, long}に公開"
return <p>{t('publishedAt', { date: publishedDate })}</p>;
// 出力（日本語）: 2024年1月15日に公開
// 出力（英語）: Published on January 15, 2024
```

### 数値のフォーマット

```typescript
const t = useTranslations('Stats');

// 翻訳ファイル: "viewCount": "閲覧数：{count, number}回"
return <p>{t('viewCount', { count: 12345 })}</p>;
// 出力（日本語）: 閲覧数：12,345回
```

### 複数形の処理

```typescript
const t = useTranslations('Comments');

// 翻訳ファイル:
// "commentCount": "{count, plural, =0 {コメントはありません} =1 {1件のコメント} other {#件のコメント}}"
return <p>{t('commentCount', { count: 5 })}</p>;
// 出力: 5件のコメント
```

## リッチテキスト（HTMLタグを含む翻訳）

### 基本的な使い方

```typescript
import { useTranslations } from 'next-intl';

export function TermsOfService() {
  const t = useTranslations('Terms');
  
  return (
    <div>
      {t.rich('agreement', {
        link: (chunks) => (
          <a href="/terms" className="text-blue-500 underline">
            {chunks}
          </a>
        ),
        strong: (chunks) => <strong>{chunks}</strong>,
      })}
    </div>
  );
}
```

翻訳ファイル:
```json
{
  "agreement": "<link>利用規約</link>に<strong>同意</strong>します"
}
```

## ルーティングと言語切り替え

### 言語切り替えコンポーネント

```typescript
'use client';

import { useRouter, usePathname } from '@/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="px-3 py-1 border rounded"
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </select>
  );
}
```

### リンクコンポーネント

```typescript
import { Link } from '@/navigation';

export function Navigation() {
  return (
    <nav>
      <Link href="/">ホーム</Link>
      <Link href="/articles">記事一覧</Link>
      <Link href="/about">About</Link>
    </nav>
  );
}
```

## メタデータの国際化

### ページメタデータ

```typescript
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ArticlePage');
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}
```

## エラーメッセージの国際化

### フォームバリデーション

```typescript
import { z } from 'zod';
import { useTranslations } from 'next-intl';

export function useLoginSchema() {
  const t = useTranslations('Validation');
  
  return z.object({
    email: z
      .string()
      .min(1, t('email.required'))
      .email(t('email.invalid')),
    password: z
      .string()
      .min(8, t('password.minLength', { min: 8 })),
  });
}
```

翻訳ファイル:
```json
{
  "email": {
    "required": "メールアドレスは必須です",
    "invalid": "有効なメールアドレスを入力してください"
  },
  "password": {
    "minLength": "パスワードは{min}文字以上で入力してください"
  }
}
```

## ベストプラクティス

### 1. 翻訳キーの命名規則

```json
{
  // ❌ 悪い例：曖昧なキー名
  "text1": "送信",
  "msg": "エラー",
  
  // ✅ 良い例：明確で階層的なキー名
  "button": {
    "submit": "送信",
    "cancel": "キャンセル"
  },
  "error": {
    "network": "ネットワークエラーが発生しました",
    "validation": "入力内容を確認してください"
  }
}
```

### 2. コンポーネント単位での翻訳ファイル分割

```typescript
// 各コンポーネントごとに翻訳を分離
const t = useTranslations('ArticleCard'); // ArticleCard.json
const t = useTranslations('UserProfile'); // UserProfile.json
```

### 3. 共通翻訳の活用

```json
// common.json - 共通で使用される翻訳
{
  "actions": {
    "save": "保存",
    "delete": "削除",
    "edit": "編集"
  },
  "status": {
    "loading": "読み込み中...",
    "error": "エラーが発生しました"
  }
}
```

### 4. 型安全性の確保

```typescript
// 翻訳キーの型を自動生成（設定により）
import { useTranslations } from 'next-intl';

export function TypedComponent() {
  // 型推論により、存在しないキーはコンパイルエラーになる
  const t = useTranslations('ArticleCard');
  return <p>{t('title')}</p>; // ✅
  // return <p>{t('nonExistentKey')}</p>; // ❌ TypeScript error
}
```

## デバッグとトラブルシューティング

### 翻訳が見つからない場合

開発環境では、翻訳キーが見つからない場合にエラーメッセージが表示されます：

```
[next-intl] Missing message: "ArticleCard.unknownKey"
```

### 言語の追加

新しい言語を追加する手順：

1. `packages/i18n/src/messages/` に新しい言語ディレクトリを作成
2. 既存の翻訳ファイルをコピーして翻訳
3. `i18n.ts` の設定を更新
4. ルーティング設定を更新

```typescript
// i18n.ts
export const locales = ['ja', 'en', 'ko'] as const; // 韓国語を追加
```