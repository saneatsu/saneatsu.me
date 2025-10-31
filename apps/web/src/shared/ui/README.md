# shared/ui - UIコンポーネント

このディレクトリには、アプリケーション全体で共有されるUIコンポーネントが含まれています。

## 重要: 循環インポートの防止

### ❌ やってはいけないこと

shared/ui 配下のコンポーネント内で、以下のようなインポートは**絶対に使用しないでください**：

```typescript
// ❌ ダメな例1: @/shared/ui からのインポート
import { Button } from "@/shared/ui";

// ❌ ダメな例2: ../ からのインポート（index.tsを参照してしまう）
import { Button } from "../";
```

これらは `shared/ui/index.ts` を経由するため、循環依存を引き起こします：

```
Component → @/shared/ui (or ../) → index.ts → Component
```

### ✅ 正しいインポート方法

**必ず相対パスで明示的にコンポーネントファイルを指定してください**：

```typescript
// ✅ 正しい例: 相対パスで直接コンポーネントファイルを指定
import { Button } from "../button/button";
import { Input } from "../input/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";
```

## なぜこのルールが必要なのか？

Storybook v10 では、Webpack のモジュール初期化が厳格になり、循環依存があると以下のエラーが発生します：

```
Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization
```

`index.ts` はバレルエクスポート（公開API）として機能しますが、shared/ui 内部のコンポーネント同士が参照する場合は、このファイルを経由せずに直接インポートする必要があります。

## チェックリスト

新しいコンポーネントを追加する際は、以下を確認してください：

- [ ] shared/ui 内の他のコンポーネントをインポートする際、相対パスで直接ファイルを指定している
- [ ] `@/shared/ui` や `../` からのインポートを使用していない
- [ ] `pnpm type-check` と `pnpm check` が通る
- [ ] Storybook のビルドが成功する（`pnpm test-storybook`）

## 参考

- [Feature-Sliced Design - Public API](https://feature-sliced.github.io/documentation/ja/docs/reference/public-api)
- この問題の修正コミット: `7ac90ce`
