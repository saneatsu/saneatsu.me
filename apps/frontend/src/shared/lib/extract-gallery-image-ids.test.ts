import { describe, expect, it } from "vitest";

import { extractGalleryImageIds } from "./extract-gallery-image-ids";

describe("ユニットテスト", () => {
	describe("extractGalleryImageIds", () => {
		it("Markdownからgallery-プレフィックスの画像IDのみを抽出する", () => {
			// Arrange
			const markdown = `
# タイトル

![ギャラリー画像](https://imagedelivery.net/abc123/gallery-image-1/medium)
![記事画像](https://imagedelivery.net/abc123/content-image-2/medium)
![サムネイル](https://imagedelivery.net/abc123/thumbnail-image-3/large)
![ギャラリー画像2](https://imagedelivery.net/abc123/gallery-image-4/xlarge)
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			// "gallery-"で始まる画像IDのみを抽出
			expect(imageIds).toEqual(["gallery-image-1", "gallery-image-4"]);
		});

		it("単一のギャラリー画像IDを抽出する", () => {
			// Arrange
			const markdown = `
# タイトル

本文...

![画像の説明](https://imagedelivery.net/abc123/gallery-test-1/medium)

本文...
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			expect(imageIds).toEqual(["gallery-test-1"]);
		});

		it("重複するギャラリー画像IDを除去する", () => {
			// Arrange
			const markdown = `
![画像1](https://imagedelivery.net/abc123/gallery-image-1/medium)

![画像1（再利用）](https://imagedelivery.net/abc123/gallery-image-1/large)

![画像2](https://imagedelivery.net/abc123/gallery-image-2/medium)

![画像1（再々利用）](https://imagedelivery.net/abc123/gallery-image-1/xlarge)
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			// 重複は除去される
			expect(imageIds).toEqual(["gallery-image-1", "gallery-image-2"]);
		});

		it("gallery-プレフィックスの画像がない場合、空配列を返す", () => {
			// Arrange
			const markdown = `
# タイトル

![記事画像](https://imagedelivery.net/abc123/content-image-1/medium)
![サムネイル](https://imagedelivery.net/abc123/thumbnail-image-2/large)
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			expect(imageIds).toEqual([]);
		});

		it("Markdown内に画像がない場合、空配列を返す", () => {
			// Arrange
			const markdown = `
# タイトル

本文のみで画像はありません。
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			expect(imageIds).toEqual([]);
		});

		it("外部の画像URLを無視する", () => {
			// Arrange
			const markdown = `
![Cloudflare Gallery](https://imagedelivery.net/abc123/gallery-image-1/medium)

![External Image](https://example.com/gallery-image.jpg)

![Another External](https://cdn.example.com/gallery-photo.png)
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			// 外部URLは無視され、Cloudflare ImagesのURLのみ抽出される
			expect(imageIds).toEqual(["gallery-image-1"]);
		});

		it("空のMarkdownを処理する", () => {
			// Arrange
			const markdown = "";

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			expect(imageIds).toEqual([]);
		});

		it("異なるバリアントのギャラリー画像IDを抽出する", () => {
			// Arrange
			const markdown = `
![Small](https://imagedelivery.net/hash1/gallery-id-1/small)
![Medium](https://imagedelivery.net/hash2/gallery-id-2/medium)
![Large](https://imagedelivery.net/hash3/gallery-id-3/large)
![XLarge](https://imagedelivery.net/hash4/gallery-id-4/xlarge)
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			expect(imageIds).toEqual([
				"gallery-id-1",
				"gallery-id-2",
				"gallery-id-3",
				"gallery-id-4",
			]);
		});

		it("content-プレフィックスとgallery-プレフィックスが混在する場合", () => {
			// Arrange
			const markdown = `
![記事画像1](https://imagedelivery.net/abc123/content-image-1/medium)
![ギャラリー画像1](https://imagedelivery.net/abc123/gallery-image-1/medium)
![記事画像2](https://imagedelivery.net/abc123/content-image-2/medium)
![ギャラリー画像2](https://imagedelivery.net/abc123/gallery-image-2/large)
![サムネイル](https://imagedelivery.net/abc123/thumbnail-image-3/xlarge)
![ギャラリー画像3](https://imagedelivery.net/abc123/gallery-image-3/medium)
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			// gallery-プレフィックスのみを抽出
			expect(imageIds).toEqual([
				"gallery-image-1",
				"gallery-image-2",
				"gallery-image-3",
			]);
		});

		it("コードブロックを含む複雑なMarkdownからギャラリー画像IDを抽出する", () => {
			// Arrange
			const markdown = `
# タイトル

コードブロック:
\`\`\`javascript
const url = "https://imagedelivery.net/abc123/gallery-not-real/medium";
console.log(url);
\`\`\`

実際の画像:
![Real Gallery Image](https://imagedelivery.net/abc123/gallery-real-image/medium)
![Content Image](https://imagedelivery.net/abc123/content-image/medium)
			`;

			// Act
			const imageIds = extractGalleryImageIds(markdown);

			// Assert
			// コードブロック内のURLも抽出されるが、gallery-プレフィックスのみ
			expect(imageIds).toEqual(["gallery-not-real", "gallery-real-image"]);
		});
	});
});
