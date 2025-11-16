# Cloudflare Images 設定ガイド

## 概要

このプロジェクトでは、画像配信に Cloudflare Images を使用しています。
このドキュメントでは、Cloudflare Images の設定方針とバリアントの使用方法について説明します。

## バリアント設定

Cloudflare Images では、画像のリサイズや最適化のために「バリアント」を定義します。
このプロジェクトでは以下の5つのバリアントを使用しています。

### バリアント一覧

| バリアント名 | サイズ | Fit モード | 用途 |
|------------|--------|-----------|------|
| small      | 400x   | contain | サムネイル、小さな画像プレビュー |
| medium     | 800x   | contain | 記事一覧のサムネイル |
| **original** | **800x** | **scale-down** | **記事内画像の保存・表示用（アップロード時のデフォルト）** |
| large      | 1200x  | contain | Lightbox拡大表示（中） |
| xlarge     | 1600x  | contain | Lightbox拡大表示（大） |

> **NOTE:** SNS向けのOGPメタデータでも `large` バリアントを使用します。幅1200pxが確保されるため、Twitter/Xのlarge card要件を満たす一方で、追加のバリアントを増やす必要がありません。
>
> **注意:** `large` バリアントは `fit=contain` でアスペクト比を維持します。元画像の比率によってはSNS側で推奨アスペクト比から外れ、プラットフォーム側で自動クロップされる可能性がありますが、バリアント管理の簡潔さを優先してこのトレードオフを受け入れています。

## Fit モードの使い分け

このプロジェクトでは、**`original` バリアントのみ `fit=scale-down` を使用し、その他のバリアント（small, medium, large, xlarge）は `fit=contain` を使用**しています。

### scale-down とは

`scale-down` は、画像を指定サイズより大きくしないリサイズモードです。

- **元の画像が指定サイズより小さい場合**: そのままのサイズで配信（拡大しない）
- **元の画像が指定サイズより大きい場合**: 指定サイズに縮小

### contain とは

`contain` は、アスペクト比を維持しながら指定サイズに収まるようにリサイズするモードです。

- **元の画像が指定サイズより小さい場合**: 指定サイズまで拡大（画質劣化の可能性あり）
- **元の画像が指定サイズより大きい場合**: 指定サイズに縮小

### なぜ original だけ scale-down を使うのか

**理由0: 元の画像サイズを保持**
- `original` バリアント（800px）で `contain` を使うと、800px未満の画像が800pxに拡大されて保存される
- `scale-down` を使うことで、元の画像サイズをそのまま保持できる
- 例: 600pxの画像を `original` (800px, contain) でアップロード → 800pxに拡大されて保存（画質劣化）
- 例: 600pxの画像を `original` (800px, scale-down) でアップロード → 600pxのまま保存（元のサイズ維持）

**理由1: モバイルのデータ通信量削減**
- 記事内で表示される `original` バリアント（800px）は、小さい画像を拡大しない
- これにより、モバイルでも適切なサイズの画像をダウンロードできる

**理由2: Lightboxでの拡大表示**
- Lightbox表示（large, xlarge）では `contain` を使用
- ユーザーが**明示的にクリックして拡大を要求**した場合、画面いっぱいに表示
- 小さい画像は拡大されて画質が劣化する可能性があるが、「大きく見たい」というニーズに応える

## 記事内の画像の表示フロー

### 1. 画像アップロード時

画像をアップロードすると、バックエンド API は `original` バリアントの URL を返します。

```
POST /api/images
→ https://imagedelivery.net/{hash}/{imageId}/original
```

マークダウンに保存されるテキスト:
```markdown
![image](https://imagedelivery.net/{hash}/{imageId}/original)
```

### 2. 記事表示時

`ZoomableImage` コンポーネントが画像を表示します。

- **通常表示**: URL の `/original` をそのまま使用（800px まで、scale-down）
- **Lightbox拡大時**: スマートサイジングにより、1段階上のバリアントに変換

#### スマートサイジングのロジック

Lightbox表示時は、元の画像バリアントより1段階大きいサイズを表示します：

| 元のバリアント | Lightbox表示時のバリアント | 説明 |
|--------------|------------------------|------|
| original (800px) | large (1200px) | 1段階上にサイズアップ |
| medium (800px) | large (1200px) | 1段階上にサイズアップ |
| large (1200px) | xlarge (1600px) | 1段階上にサイズアップ |
| xlarge (1600px) | xlarge (1600px) | 最大サイズのため変更なし |

### 3. 実際の表示サイズ

Fit モードにより、以下のように表示されます:

#### 記事内（original バリアント、scale-down）
- 100px の画像 → 100px（拡大されない）
- 500px の画像 → 500px（そのまま）
- 1000px の画像 → 800px（original の上限に縮小）
- 2000px の画像 → 800px（original の上限に縮小）

#### Lightbox拡大時（large バリアント、contain）
- **100px の画像 → 1200px（拡大される、画質劣化あり）**
- **600px の画像 → 1200px（拡大される、画質劣化あり）**
- 1000px の画像 → 1000px（そのまま）
- 2000px の画像 → 1200px（large の上限に縮小）

**注意**: Lightboxでは `contain` を使用するため、小さい画像も拡大されます。これにより画質が劣化する可能性がありますが、ユーザーが明示的に拡大を要求した場合のため許容範囲です。

## Cloudflare での設定方法

### バリアントの作成・編集

1. Cloudflare ダッシュボード → Images → Variants
2. 各バリアントを以下の設定で作成:

**small**:
- Width: 400
- Height: (空白または400)
- Fit: **contain**
- Metadata: none
- Format: auto

**medium**:
- Width: 800
- Height: (空白または800)
- Fit: **contain**
- Metadata: none
- Format: auto

**original**:
- Width: 800
- Height: (空白または800)
- Fit: **scale-down**
- Metadata: none
- Format: auto

**large**:
- Width: 1200
- Height: (空白または1200)
- Fit: **contain**
- Metadata: none
- Format: auto

**xlarge**:
- Width: 1600
- Height: (空白または1600)
- Fit: **contain**
- Metadata: none
- Format: auto

## 注意事項

### 既存のバリアント設定を変更する場合

既存のバリアント設定を変更すると、すでに配信されている画像の表示が変わります。
CDN キャッシュがクリアされるまで、古い設定で表示される可能性があります。

### scale-down 以外の fit モードを使う場合

特定のユースケース（例：アバター画像を正方形にトリミングしたい）で `scale-down` 以外を使いたい場合は、
専用のバリアントを新規作成してください。既存のバリアントは変更しないでください。

## 参考リンク

- [Cloudflare Images - Create variants](https://developers.cloudflare.com/images/manage-images/create-variants/)
- [Cloudflare Images - Resize options](https://developers.cloudflare.com/images/transform-images/resize-images/)
