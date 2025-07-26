---
sidebar_position: 2
---

# Feature-Sliced Design

Feature-Sliced Design (FSD) の具体的な実装方法と、saneatsu.me プロジェクトでの活用例を詳しく解説します。

## 🧩 FSD の基本概念

### **階層（Layers）とスライス（Slices）**

```
src/
├── views/           # Views Layer - ページレベル
├── widgets/         # Widgets Layer - 独立UIブロック  
├── features/        # Features Layer - ユーザー機能
├── entities/        # Entities Layer - ビジネスエンティティ
└── shared/          # Shared Layer - 共通ライブラリ
```

### **セグメント（Segments）構造**

各スライス内は以下のセグメントで構成：

```
article/             # スライス名
├── ui/              # UIコンポーネント
├── model/           # ビジネスロジック・状態管理
├── api/             # API通信
├── lib/             # ユーティリティ
├── config/          # 設定
└── index.ts         # Public API
```

## 📋 各レイヤーの詳細実装

### **1. Views Layer - ページレベルコンポーネント**

#### **役割と責任**
- ページ全体のレイアウトとUI構成
- 複数のWidgetとFeatureの組み合わせ
- ルーティング固有のロジック

#### **実装例：ホームページ**
```typescript
// views/home/ui/home-view.tsx
import { ArticlesList } from '../../../widgets/articles-list'
import { ArticleSearch } from '../../../features/article'

export function HomeView() {
  return (
    <main className="container mx-auto px-4 py-8 space-y-12">
      {/* ヒーローセクション */}
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold mb-4">
          Saneatsu Blog
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          技術とライフスタイルに関する記事をお届けします
        </p>
        <ArticleSearch />
      </section>

      {/* 記事一覧セクション */}
      <section>
        <h2 className="text-2xl font-bold mb-6">最新記事</h2>
        <ArticlesList />
      </section>
    </main>
  )
}
```

#### **実装例：記事詳細ページ**
```typescript
// views/article-detail/ui/article-detail-view.tsx
import { Article } from '../../../shared'
import { MarkdownRenderer } from '../../../shared/ui'

interface ArticleDetailViewProps {
  article: Article
  locale: string
}

export function ArticleDetailView({ article, locale }: ArticleDetailViewProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      <article className="prose prose-lg mx-auto">
        {/* 記事ヘッダー */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          
          {article.publishedAt && (
            <time 
              dateTime={article.publishedAt}
              className="text-gray-600"
            >
              公開日: {new Date(article.publishedAt).toLocaleDateString(locale)}
            </time>
          )}
          
          <div className="flex items-center gap-2 mt-4">
            <span className={`
              px-2 py-1 rounded text-sm font-medium
              ${article.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
              }
            `}>
              {article.status === 'published' ? '公開' : '下書き'}
            </span>
          </div>
        </header>

        {/* 記事本文 */}
        <MarkdownRenderer content={article.content} />
        
        {/* フッター */}
        <footer className="mt-12 pt-8 border-t">
          <a 
            href={`/${locale}`}
            className="text-blue-600 hover:underline"
          >
            ← 記事一覧に戻る
          </a>
        </footer>
      </article>
    </main>
  )
}
```

#### **Public API**
```typescript
// views/home/index.ts
export { HomeView } from './ui/home-view'

// views/article-detail/index.ts  
export { ArticleDetailView } from './ui/article-detail-view'

// views/index.ts
export { HomeView } from './home'
export { ArticleDetailView } from './article-detail'
```

### **2. Widgets Layer - 独立UIブロック**

#### **役割と責任**
- 自己完結したUIブロック
- 複数のEntitiesとFeaturesの組み合わせ
- 再利用可能なUIパターン

#### **実装例：記事一覧Widget**
```typescript
// widgets/articles-list/ui/articles-list.tsx
import { useState, useEffect } from 'react'
import { Article } from '../../../entities/article'
import { ArticleCard } from '../../../entities/article/ui'
import { ArticleFilter } from '../../../features/article'

export function ArticlesList() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    tagId: undefined as number | undefined,
    status: 'published' as const,
  })

  useEffect(() => {
    async function loadArticles() {
      setLoading(true)
      try {
        const response = await fetch('/api/articles?' + new URLSearchParams({
          ...filters,
          tagId: filters.tagId?.toString() || '',
        }))
        const data = await response.json()
        setArticles(data.data)
      } catch (error) {
        console.error('Failed to load articles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [filters])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <ArticleFilter
        onTagSelect={(tagId) => setFilters(prev => ({ ...prev, tagId }))}
        onStatusSelect={(status) => setFilters(prev => ({ ...prev, status }))}
      />

      {/* 記事グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">記事が見つかりませんでした。</p>
        </div>
      )}
    </div>
  )
}
```

#### **実装例：ヘッダーWidget**
```typescript
// widgets/header/ui/header.tsx
import { LanguageSwitcher } from '../../../features/lang'
import { ThemeToggle } from '../../../features/theme'

export function Header() {
  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <a href="/" className="font-bold text-xl">
            saneatsu.me
          </a>

          {/* ナビゲーション */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/articles" className="hover:text-blue-600">
              記事
            </a>
            <a href="/tags" className="hover:text-blue-600">
              タグ
            </a>
            <a href="/about" className="hover:text-blue-600">
              About
            </a>
          </nav>

          {/* ユーティリティ */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
```

### **3. Features Layer - ユーザー機能**

#### **役割と責任**
- 特定のユーザー機能の実装
- ビジネスロジックの中心
- Entitiesの操作と状態管理

#### **実装例：記事検索機能**
```typescript
// features/article/ui/article-search.tsx
import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ArticleSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export function ArticleSearch({ onSearch, placeholder }: ArticleSearchProps) {
  const [query, setQuery] = useState('')
  const t = useTranslations('search')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md mx-auto">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || t('placeholder')}
        className="
          w-full pl-10 pr-4 py-2 
          border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        "
      />
    </form>
  )
}
```

#### **実装例：記事フィルター機能**
```typescript
// features/article/ui/article-filter.tsx
import { Tag } from '../../../entities/tag'
import { useTranslations } from 'next-intl'

interface ArticleFilterProps {
  tags: Tag[]
  selectedTagId?: number
  selectedStatus?: 'all' | 'published' | 'draft'
  onTagSelect: (tagId: number | undefined) => void
  onStatusSelect: (status: 'all' | 'published' | 'draft') => void
}

export function ArticleFilter({
  tags,
  selectedTagId,
  selectedStatus = 'published',
  onTagSelect,
  onStatusSelect,
}: ArticleFilterProps) {
  const t = useTranslations('filter')
  
  const showClearButton = selectedTagId || selectedStatus !== 'published'

  const handleClear = () => {
    onTagSelect(undefined)
    onStatusSelect('published')
  }

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
      {/* タグフィルター */}
      <div className="flex items-center gap-2">
        <label htmlFor="tag-filter" className="text-sm font-medium">
          {t('byTag')}
        </label>
        <select
          id="tag-filter"
          value={selectedTagId || ''}
          onChange={(e) => onTagSelect(e.target.value ? Number(e.target.value) : undefined)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">{t('allTags')}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>

      {/* ステータスフィルター */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium">
          {t('byStatus')}
        </label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => onStatusSelect(e.target.value as any)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">{t('allStatus')}</option>
          <option value="published">{t('published')}</option>
          <option value="draft">{t('draft')}</option>
        </select>
      </div>

      {/* クリアボタン */}
      {showClearButton && (
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-blue-600 hover:underline"
        >
          {t('clear')}
        </button>
      )}
    </div>
  )
}
```

#### **Model層（状態管理）**
```typescript
// features/article/model/search.ts
import { create } from 'zustand'

interface SearchState {
  query: string
  results: Article[]
  loading: boolean
  setQuery: (query: string) => void
  search: (query: string) => Promise<void>
  clearResults: () => void
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  loading: false,
  
  setQuery: (query) => set({ query }),
  
  search: async (query) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/articles/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      set({ results: data.data, loading: false })
    } catch (error) {
      console.error('Search failed:', error)
      set({ loading: false })
    }
  },
  
  clearResults: () => set({ results: [], query: '' }),
}))
```

### **4. Entities Layer - ビジネスエンティティ**

#### **役割と責任**
- ドメインモデルの定義
- エンティティ固有のUI コンポーネント
- データ操作のロジック

#### **実装例：Article Entity**
```typescript
// entities/article/model/types.ts
export interface Article {
  id: number
  slug: string
  title: string
  content: string
  status: 'draft' | 'published'
  publishedAt: string | null
  cfImageId: string | null
}

// entities/article/ui/article-card.tsx
import { Article } from '../model/types'
import { formatDate } from '../../../shared/lib'

interface ArticleCardProps {
  article: Article
  locale?: string
}

export function ArticleCard({ article, locale = 'ja' }: ArticleCardProps) {
  return (
    <article className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* 画像 */}
      {article.cfImageId && (
        <div className="aspect-video bg-gray-100">
          <img
            src={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH}/${article.cfImageId}/public`}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* コンテンツ */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 line-clamp-2">
          <a href={`/${locale}/articles/${article.slug}`} className="hover:text-blue-600">
            {article.title}
          </a>
        </h3>
        
        {article.publishedAt && (
          <time className="text-sm text-gray-600">
            {formatDate(article.publishedAt, locale)}
          </time>
        )}
        
        <div className="mt-4">
          <span className={`
            inline-block px-2 py-1 rounded text-xs font-medium
            ${article.status === 'published' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
            }
          `}>
            {article.status === 'published' ? '公開' : '下書き'}
          </span>
        </div>
      </div>
    </article>
  )
}
```

#### **API層**
```typescript
// entities/article/api/articles.ts
import { Article } from '../model/types'

export async function getArticles(params: {
  page?: number
  limit?: number
  tagId?: number
  status?: string
  lang?: string
}): Promise<{ data: Article[]; pagination: any }> {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString())
    }
  })
  
  const response = await fetch(`/api/articles?${searchParams}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch articles')
  }
  
  return response.json()
}

export async function getArticle(slug: string, lang?: string): Promise<Article> {
  const params = lang ? `?lang=${lang}` : ''
  const response = await fetch(`/api/articles/${slug}${params}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch article')
  }
  
  const data = await response.json()
  return data.data
}
```

### **5. Shared Layer - 共通ライブラリ**

#### **役割と責任**
- 汎用的なユーティリティ
- 再利用可能なUIコンポーネント
- 設定とコンスタンツ

#### **API Client**
```typescript
// shared/api/client.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3210'

export class ApiClient {
  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(path, BASE_URL)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString())
        }
      })
    }
    
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return response.json()
  }
  
  async post<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return response.json()
  }
}

export const apiClient = new ApiClient()
```

#### **共通UI コンポーネント**
```typescript
// shared/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

## 📏 FSD実装のベストプラクティス

### **1. Import/Exportルール**

#### **絶対パスの使用禁止**
```typescript
// ❌ 絶対パスを使わない
import { Article } from '@/entities/article'

// ✅ 相対パスを使う
import { Article } from '../../../entities/article'
```

#### **Public API経由のアクセス**
```typescript
// ❌ 内部実装に直接アクセス
import { ArticleCard } from '../../../entities/article/ui/article-card'

// ✅ Public API経由でアクセス
import { ArticleCard } from '../../../entities/article'
```

#### **Index.tsでの適切なエクスポート**
```typescript
// entities/article/index.ts
export type { Article } from './model/types'
export { ArticleCard } from './ui/article-card'
export { getArticles, getArticle } from './api/articles'

// 内部実装は非公開
// export { ArticleRepository } from './lib/repository' // ❌
```

### **2. 依存関係の管理**

#### **ESLintルールの設定**
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // FSD import rules
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // shared cannot import from upper layers
          {
            target: './src/shared/**/*',
            from: ['./src/entities', './src/features', './src/widgets', './src/views'],
          },
          // entities cannot import from upper layers
          {
            target: './src/entities/**/*',
            from: ['./src/features', './src/widgets', './src/views'],
          },
          // features cannot import from upper layers
          {
            target: './src/features/**/*',
            from: ['./src/widgets', './src/views'],
          },
          // widgets cannot import from upper layers
          {
            target: './src/widgets/**/*',
            from: ['./src/views'],
          },
        ],
      },
    ],
  },
}
```

### **3. テスト戦略**

#### **レイヤー別テストアプローチ**
```typescript
// entities/article/ui/article-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ArticleCard } from './article-card'

describe('ArticleCard', () => {
  const mockArticle = {
    id: 1,
    slug: 'test-article',
    title: 'Test Article',
    content: 'Test content',
    status: 'published' as const,
    publishedAt: '2024-01-01T00:00:00Z',
    cfImageId: null,
  }

  it('should render article title', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('Test Article')).toBeInTheDocument()
  })

  it('should render published status badge', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('公開')).toBeInTheDocument()
  })
})
```

## 🎯 FSDの利点と実際の効果

### **開発効率の向上**
- **明確な責任分離**: どこに何を書くべきか迷わない
- **予測可能な構造**: ファイルの場所が直感的
- **並行開発**: 開発者間の競合が少ない

### **保守性の向上**
- **影響範囲の限定**: 変更時の影響が予測可能
- **テスト容易性**: 単一責任によるテストの簡素化
- **リファクタリング安全性**: 依存関係が明確

### **スケーラビリティ**
- **機能追加**: 新しいスライスを追加するだけ
- **チーム拡大**: 一貫した構造で新メンバーの理解が早い
- **コード再利用**: 下位レイヤーの高い再利用性

---

このFSD実装により、saneatsu.meプロジェクトは高い保守性とスケーラビリティを実現しています。