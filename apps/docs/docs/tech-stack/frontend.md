---
sidebar_position: 2
---

# Frontend Technologies

フロントエンド開発で使用している主要技術の詳細な解説です。

## 🚀 Next.js 15

### 主要機能の活用

#### **App Router**
```typescript
// app/[locale]/articles/[slug]/page.tsx
export default async function ArticlePage({
  params,
}: {
  params: { locale: string; slug: string }
}) {
  const article = await getArticle(params.slug, params.locale);
  
  return (
    <main>
      <ArticleDetailView article={article} locale={params.locale} />
    </main>
  );
}
```

#### **Server Components**
- 初期ロードの高速化
- SEO最適化
- データフェッチの効率化

#### **動的ルーティング**
```
app/
├── [locale]/
│   ├── page.tsx              # ホームページ
│   ├── articles/
│   │   ├── page.tsx          # 記事一覧
│   │   └── [slug]/
│   │       └── page.tsx      # 記事詳細
│   └── layout.tsx            # 共通レイアウト
```

### パフォーマンス最適化

#### **画像最適化**
```typescript
import Image from 'next/image'

export function ArticleImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={400}
      placeholder="blur"
      className="rounded-lg"
      priority // Above the fold images
    />
  );
}
```

#### **フォント最適化**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## ⚛️ React 19

### 新機能の活用

#### **Server Actions**
```typescript
'use server'

export async function updateArticle(formData: FormData) {
  const article = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
  };
  
  // Database update
  await updateArticleInDB(article);
  revalidatePath('/articles');
}
```

#### **Suspense with Error Boundaries**
```typescript
// components/ArticlesList.tsx
export function ArticlesList() {
  return (
    <ErrorBoundary fallback={<ArticlesError />}>
      <Suspense fallback={<ArticlesSkeleton />}>
        <ArticlesContent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

#### **並行機能**
```typescript
import { useTransition } from 'react';

export function SearchForm() {
  const [isPending, startTransition] = useTransition();
  
  const handleSearch = (query: string) => {
    startTransition(() => {
      // Non-urgent update
      updateSearchResults(query);
    });
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isPending && <Spinner />}
    </div>
  );
}
```

## 🎨 Tailwind CSS 4.x

### 設定とカスタマイゼーション

#### **設定ファイル**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

#### **コンポーネントスタイル**
```typescript
// shared/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

### レスポンシブデザイン

#### **ブレークポイント戦略**
```typescript
// 画面サイズ別のスタイル定義
const ArticleCard = () => (
  <article className="
    p-4 
    sm:p-6 
    md:p-8 
    lg:p-10
    
    grid 
    grid-cols-1 
    md:grid-cols-2 
    lg:grid-cols-3
    
    gap-4 
    sm:gap-6 
    md:gap-8
  ">
    {/* コンテンツ */}
  </article>
);
```

## 🌍 next-intl

### 国際化設定

#### **設定ファイル**
```typescript
// src/shared/config/i18n.ts
export const locales = ['ja', 'en'] as const;
export const defaultLocale = 'ja' as const;

export type Locale = typeof locales[number];

export function getMessages(locale: Locale) {
  switch (locale) {
    case 'ja':
      return import('@/i18n/locales/ja.json');
    case 'en':
      return import('@/i18n/locales/en.json');
    default:
      return import('@/i18n/locales/ja.json');
  }
}
```

#### **翻訳ファイル**
```json
// packages/i18n/src/locales/ja.json
{
  "navigation": {
    "home": "ホーム",
    "articles": "記事",
    "about": "このサイトについて"
  },
  "article": {
    "publishedAt": "公開日: {date}",
    "readMore": "続きを読む",
    "notFound": {
      "title": "記事が見つかりません",
      "description": "指定された記事は存在しないか、削除された可能性があります。"
    }
  }
}
```

#### **コンポーネントでの使用**
```typescript
import { useTranslations } from 'next-intl';

export function ArticleCard({ article }: { article: Article }) {
  const t = useTranslations('article');
  
  return (
    <article className="border rounded-lg p-6">
      <h2 className="text-xl font-bold">{article.title}</h2>
      {article.publishedAt && (
        <time className="text-gray-600">
          {t('publishedAt', { 
            date: new Date(article.publishedAt).toLocaleDateString() 
          })}
        </time>
      )}
      <Link href={`/articles/${article.slug}`}>
        {t('readMore')}
      </Link>
    </article>
  );
}
```

### 動的言語切り替え

```typescript
// widgets/header/ui/language-switcher.tsx
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  
  const switchLanguage = (newLocale: string) => {
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  };
  
  return (
    <select 
      value={currentLocale}
      onChange={(e) => switchLanguage(e.target.value)}
      className="border rounded px-2 py-1"
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </select>
  );
}
```

## 📦 その他の重要ライブラリ

### **React Markdown**
```typescript
// shared/ui/markdown-renderer.tsx
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-semibold mb-3">{children}</h2>
        ),
        code: ({ inline, children, ...props }) => (
          inline ? (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
              {children}
            </code>
          ) : (
            <code className="block bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
              {children}
            </code>
          )
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

#### HTMLコメントの扱い
- 記事本文内で `<!-- 非公開 -->` のように HTML コメント記法で囲んだブロックは、`remarkComment` プラグインによって MarkdownPreview から除外されます。
- 「公開前の下書きメモを一時的に残しておく」といったケースでもプレビューや本番表示に影響が出ないため、安心してコメントアウトできます。


### **Lucide Icons**
```typescript
import { Search, Menu, X, ChevronDown } from 'lucide-react';

export function SearchForm() {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input 
        type="search"
        placeholder="記事を検索..."
        className="pl-10 pr-4 py-2 border rounded-lg w-full"
      />
    </div>
  );
}
```

## 🎯 フロントエンドアーキテクチャの特徴

### **型安全性**
- TypeScript による静的型チェック
- Zod スキーマによるランタイム検証
- API レスポンスの型安全性

### **パフォーマンス**
- Server Components による初期ロード最適化
- Code Splitting による効率的なバンドルサイズ
- Image Optimization による画像配信最適化

### **開発体験**
- Hot Reload による高速な開発サイクル
- TypeScript IntelliSense による開発効率向上
- Storybook による コンポーネント単位の開発

### **保守性**
- Feature-Sliced Design による明確な責任分離
- 一貫したコーディング規約
- 包括的なテストカバレッジ

---

次のセクション: **[Backend Technologies](./backend)** でバックエンド技術の詳細をご覧ください。
