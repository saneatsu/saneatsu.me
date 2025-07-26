---
sidebar_position: 3
---

# Storybook テストガイド

Storybookを使用したコンポーネントの視覚的テストとインタラクションテストについて説明します。

## 基本的な使い方

### Storyファイルの作成

コンポーネントと同じディレクトリに `.stories.tsx` ファイルを作成します：

```
src/shared/ui/button/
  button.tsx
  button.stories.tsx  # Storyファイル
```

### 基本的なStory構造

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { Button } from './button';

const meta = {
  component: Button,
  parameters: {
    viewport: {
      defaultViewport: 'reset'
    }
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'デフォルト表示',
  args: {
    children: 'ボタン',
  },
};
```

## Play関数によるインタラクションテスト

### 基本的なplay関数

```typescript
export const ClickableButton: Story = {
  name: 'クリック可能なボタン',
  args: {
    children: 'クリック',
    onClick: () => console.log('clicked'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // ボタンが表示されていることを確認
    await expect(button).toBeInTheDocument();
    
    // ボタンをクリック
    await userEvent.click(button);
  },
};
```

### フォームバリデーションのテスト

```typescript
export const FormValidation: Story = {
  name: 'フォームバリデーション',
  tags: ['validation'],
  render: () => (
    <form>
      <input 
        type="email" 
        required 
        placeholder="メールアドレス"
        aria-label="メールアドレス"
      />
      <Button type="submit">送信</Button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = canvas.getByLabelText('メールアドレス');
    const submitButton = canvas.getByRole('button', { name: '送信' });
    
    // 空の状態で送信
    await userEvent.click(submitButton);
    
    // HTML5バリデーションエラーを確認
    await expect(emailInput).toBeInvalid();
    
    // 不正なメールアドレスを入力
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitButton);
    await expect(emailInput).toBeInvalid();
    
    // 正しいメールアドレスを入力
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'test@example.com');
    await expect(emailInput).toBeValid();
  },
};
```

## Storyのタグ

プロジェクトで使用される主なタグ：

```typescript
export const ViewOnlyStory: Story = {
  name: '表示のみ',
  tags: ['code-only'],  // play関数なし、UIの確認のみ
  args: {
    // ...
  },
};

export const ValidationStory: Story = {
  name: 'バリデーション',
  tags: ['validation'],  // フォームバリデーションをテスト
  play: async ({ canvasElement }) => {
    // バリデーションテスト
  },
};
```

## 複雑なコンポーネントのテスト

### モーダルやドロップダウンのテスト

```typescript
export const ModalInteraction: Story = {
  name: 'モーダルの開閉',
  render: () => <ModalComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // モーダルが閉じていることを確認
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    
    // 開くボタンをクリック
    const openButton = canvas.getByRole('button', { name: 'モーダルを開く' });
    await userEvent.click(openButton);
    
    // モーダルが表示されることを確認
    const modal = await canvas.findByRole('dialog');
    await expect(modal).toBeInTheDocument();
    
    // 閉じるボタンをクリック
    const closeButton = within(modal).getByRole('button', { name: '閉じる' });
    await userEvent.click(closeButton);
    
    // モーダルが閉じることを確認
    await expect(modal).not.toBeInTheDocument();
  },
};
```

### 非同期処理のテスト

```typescript
export const AsyncDataLoading: Story = {
  name: '非同期データ読み込み',
  render: () => <AsyncComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // ローディング状態を確認
    await expect(canvas.getByText('読み込み中...')).toBeInTheDocument();
    
    // データが表示されるまで待機
    const dataElement = await canvas.findByText('データが読み込まれました', {}, {
      timeout: 3000
    });
    await expect(dataElement).toBeInTheDocument();
  },
};
```

## レスポンシブデザインのテスト

### モバイル表示のStory

```typescript
export const MobileView: Story = {
  name: 'モバイル表示',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    // モバイル用のprops
  },
};

export const TabletView: Story = {
  name: 'タブレット表示',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
```

## デコレーターの使用

### プロバイダーでラップ

```typescript
// .storybook/preview.tsx で設定されている場合は不要
const meta = {
  component: MyComponent,
  decorators: [
    (Story) => (
      <ThemeProvider theme="dark">
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof MyComponent>;
```

## Storybookのベストプラクティス

### 1. わかりやすい名前を日本語で記述

```typescript
export const SubmitButton: Story = {
  name: '送信ボタン',  // 日本語でわかりやすく
  // ...
};
```

### 2. プロパティの順序を統一

```typescript
export const ExampleStory: Story = {
  name: 'ストーリー名',
  tags: ['validation'],
  args: {
    // props
  },
  parameters: {
    // parameters
  },
  render: () => <Component />,
  play: async ({ canvasElement }) => {
    // テスト
  },
};
```

### 3. 網羅的なテストケース

```typescript
// すべてのバリエーションをカバー
export const Primary: Story = {
  name: 'プライマリー',
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  name: 'セカンダリー',
  args: { variant: 'secondary' },
};

export const Disabled: Story = {
  name: '無効状態',
  args: { disabled: true },
};

export const Loading: Story = {
  name: 'ローディング状態',
  args: { loading: true },
};
```

### 4. アクセシビリティを考慮

```typescript
play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  
  // aria属性での要素取得を優先
  const button = canvas.getByRole('button', { name: '送信' });
  const input = canvas.getByLabelText('メールアドレス');
  
  // data-testidは最終手段
  // const element = canvas.getByTestId('custom-element');
}
```

## 実行とデバッグ

### Storybookの起動

```bash
# Storybookを起動
cd apps/web
pnpm storybook

# http://localhost:6006 でアクセス
```

### テストの実行

```bash
# すべてのStorybookテストを実行
pnpm test -- --project=storybook

# 特定のファイルのテストを実行
pnpm test -- --project=storybook src/shared/ui/button/button.stories.tsx
```

### デバッグ方法

1. Storybook UIで対象のStoryを開く
2. Interactionsタブでplay関数の実行を確認
3. エラーがある場合は、ステップごとに確認可能

## トラブルシューティング

### @saneatsu/db のインポートエラー

```typescript
// ❌ stories内で直接DBをインポートしない
import { db } from '@saneatsu/db';

// ✅ コンポーネント内でのみDBを使用し、
// Storyではモックデータを渡す
export const WithData: Story = {
  args: {
    data: mockArticleData,  // モックデータを使用
  },
};
```

### ViewportのリセットIssue

```typescript
// metaで必ずdefaultViewportをresetに設定
const meta = {
  component: MyComponent,
  parameters: {
    viewport: {
      defaultViewport: 'reset',  // 必須
    },
  },
};
```