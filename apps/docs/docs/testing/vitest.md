---
sidebar_position: 2
---

# Vitest テストガイド

Vitestを使用した単体テストと結合テストの作成方法について説明します。

## 基本的な使い方

### テストファイルの作成

テスト対象のファイルと同じディレクトリに `.test.ts(x)` ファイルを作成します：

```
src/
  components/
    Button.tsx
    Button.test.tsx  # テストファイル
```

### 基本的なテスト構造

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  // Unit Test
  describe('Unit Test', () => {
    it('should render with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should have correct type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  // Integration Test
  describe('Integration Test', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const { user } = render(<Button onClick={handleClick}>Click</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

## React Testing Library

### レンダリングとクエリ

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// コンポーネントをレンダリング
const { user } = render(<MyComponent />);

// 要素の取得（推奨順）
// 1. ロールで取得
const button = screen.getByRole('button', { name: '送信' });

// 2. ラベルテキストで取得
const input = screen.getByLabelText('メールアドレス');

// 3. プレースホルダーで取得
const searchInput = screen.getByPlaceholderText('検索...');

// 4. テキストで取得
const heading = screen.getByText('見出しテキスト');

// 5. テストIDで取得（最終手段）
const element = screen.getByTestId('custom-element');
```

### ユーザーインタラクション

```typescript
// クリック
await user.click(button);

// テキスト入力
await user.type(input, 'test@example.com');

// 選択
await user.selectOptions(select, 'option-value');

// キーボード操作
await user.keyboard('{Enter}');
```

## モックとスタブ

### 関数のモック

```typescript
// vi.hoistedを使用したモック
const { mockFunction } = vi.hoisted(() => ({
  mockFunction: vi.fn()
}));

// モジュールのモック
vi.mock('@/lib/api', () => ({
  fetchData: mockFunction
}));

describe('Component with API', () => {
  beforeEach(() => {
    mockFunction.mockClear();
  });

  it('should fetch data on mount', () => {
    mockFunction.mockResolvedValue({ data: 'test' });
    render(<DataComponent />);
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

### Next.jsのモック

```typescript
// useRouterのモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Imageコンポーネントのモック
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));
```

## フォームテスト

### React Hook Formのテスト

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    const { user } = render(<LoginForm onSubmit={onSubmit} />);

    // フォームに入力
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');

    // 送信
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // 送信されたデータを確認
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show validation errors', async () => {
    const { user } = render(<LoginForm onSubmit={vi.fn()} />);

    // 空のまま送信
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // エラーメッセージを確認
    expect(await screen.findByText('メールアドレスは必須です')).toBeInTheDocument();
  });
});
```

## 非同期テスト

### APIコールのテスト

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ArticleList } from './ArticleList';

// APIモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ArticleList', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should display articles after loading', async () => {
    // APIレスポンスをモック
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, title: '記事1' },
          { id: 2, title: '記事2' },
        ],
      }),
    });

    render(<ArticleList />);

    // ローディング状態を確認
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    // 記事が表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText('記事1')).toBeInTheDocument();
      expect(screen.getByText('記事2')).toBeInTheDocument();
    });
  });

  it('should display error message on failure', async () => {
    // エラーレスポンスをモック
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ArticleList />);

    // エラーメッセージが表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });
});
```

## カスタムフックのテスト

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

## テストユーティリティ

### カスタムレンダー関数

```typescript
// test-utils.tsx
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';

export function renderWithProviders(
  ui: React.ReactElement,
  options?: any
) {
  const user = userEvent.setup();
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider
        locale="ja"
        messages={{}}
      >
        {children}
      </NextIntlClientProvider>
    );
  }

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
```

## テストのベストプラクティス

### 1. AAA パターン

```typescript
it('should do something', () => {
  // Arrange（準備）
  const props = { title: 'Test' };
  
  // Act（実行）
  render(<Component {...props} />);
  
  // Assert（検証）
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### 2. 一つのテストに一つのアサーション

```typescript
// ❌ 悪い例
it('should render and handle click', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);
  expect(screen.getByText('Click')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalled();
});

// ✅ 良い例
it('should render button text', () => {
  render(<Button>Click</Button>);
  expect(screen.getByText('Click')).toBeInTheDocument();
});

it('should handle click event', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);
  fireEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalled();
});
```

### 3. テストデータの管理

```typescript
// factories/article.ts
export function createArticle(overrides = {}) {
  return {
    id: 1,
    title: 'テスト記事',
    content: 'テスト内容',
    publishedAt: '2024-01-01',
    ...overrides,
  };
}

// テストでの使用
const article = createArticle({ title: 'カスタムタイトル' });
```