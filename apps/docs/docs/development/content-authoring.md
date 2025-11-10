---
title: コンテンツ執筆ガイド
---

本書では、Markdownで記事を書く際のGoogle Maps埋め込みルールをまとめています。サイトのMarkdownレンダラはGoogle Maps用の特別なRemarkプラグインを通して安全にiframeを生成するため、執筆者は以下のどちらかの方法を選べます。

## 1. URLだけを貼る（座標ピン表示）

1. Google Mapsで目的地を開きます。
2. ブラウザのアドレスバーに表示される `https://www.google.com/maps/place/.../@緯度,経度,ズームz` 形式のURLをコピーします。
3. Markdown本文に、そのURLを **単独行** で貼り付けます。

```markdown
https://www.google.com/maps/place/Chocolaterie+%26+Bar+ROND-POINT+by+Hirofumi+Tanakamaru/@35.6599597,139.6932463,13z
```

この方法では左上に緯度経度の座標ラベルが表示され、店舗名カードは出ません。店舗名を強調したい場合は下記のiframe方式を選んでください。`maps.app.goo.gl` などの短縮リンクを使った場合は解析できないため、必ず一度ブラウザで開いて正規の `google.com/maps/...` URLを取得してください。

## 2. Google公式iframeを貼る（プレイスカード付き）

1. Google Mapsで場所を開き、左側の「共有」→「地図を埋め込む」タブを選びます。
2. サイズを選択し、「HTML をコピー」を押します。
3. MarkdownにはコピーしたSnipppetのうち、`<iframe ...>` 部分をそのまま貼り付けます。

```markdown
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12..." width="600" height="450" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
```

埋め込み用のiframeはRemarkプラグイン側で検証し、`/maps/embed` 以外のURLは破棄するため、XSSリスクを抑えつつGoogleが提供するプレイスカードUI（店舗名・レビュー等）を表示できます。

## よくある質問

- **Q. 短縮URL（`maps.app.goo.gl`）を貼っても良い？**
  - A. ダメです。リダイレクト先の情報を取得できないため、必ず `google.com/maps/...` 形式のURLか、iframeの `src` を貼ってください。
- **Q. iframeの属性は編集して良い？**
  - A. 幅・高さ・style程度の調整は問題ありませんが、`src` はGoogleの `https://www.google.com/maps/embed?pb=` で始まるものだけ使用してください。それ以外はレンダリング時に拒否されます。

このガイドを守ることで、MarkdownだけでGoogle Mapsの座標ピン・プレイスカード両方を安全にプレビューできます。
