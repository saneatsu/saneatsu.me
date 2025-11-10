# Markdown執筆ガイド（抜粋）

## Google Mapsの埋め込み

ブログ記事やお知らせで店舗・会場の位置を共有したい場合は、以下のどちらかの方法でGoogle Mapsを埋め込めます。

- Google Mapsの**共有URLを1行だけ**貼る（座標ピン表示）
- 共有ダイアログ「地図を埋め込む」で表示される`iframe`スニペットを貼る（プレイスカード表示）

### 手順

1. Google Mapsで場所を開き、アドレスバーのURLをコピーします。
2. 可能であれば `/@緯度,経度,ズームz` 形式になるように、共有ダイアログの `埋め込み` ではなくブラウザURLを利用します。
3. Markdown本文にそのURLのみを単独行で貼り付けます。

```markdown
https://www.google.com/maps/place/Chocolaterie+%26+Bar+ROND-POINT+by+Hirofumi+Tanakamaru/@35.6599597,139.6932463,13z

<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12..." width="600" height="450" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
```

### 補足

- `maps.app.goo.gl` などの短縮リンクは、ブラウザで一度開いてからフルURL（またはiframeの`src`）をコピーしてください。
- プレイスカード付き表示にしたい場合は、共有ダイアログの「地図を埋め込む」タブで `HTML をコピー` を押し、得られた `iframe` をそのまま貼り付けてください。
- URL内の `@35.6599,139.6932,13z` や `?q=35.6599,139.6932` といった座標情報を優先的に利用します。
- もし解析できない場合に備えて、本文中に店舗名や住所テキストも併記すると安心です。

エディタのプレビューや本番画面では、自動的にGoogle Mapsの埋め込みが表示されます。
