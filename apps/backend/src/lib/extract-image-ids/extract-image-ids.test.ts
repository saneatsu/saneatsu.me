import { describe, expect, it } from "vitest";

import { extractImageIdsFromMarkdown } from "./extract-image-ids";

describe("ユニットテスト", () => {
	describe("extractImageIdsFromMarkdown", () => {
		it("Markdownから単一の画像IDを抽出する", () => {
			// Arrange
			const markdown = `
# タイトル

本文...

![画像の説明](https://imagedelivery.net/abc123/test-image-id-1/medium)

本文...
			`;

			// Act
			const imageIds = extractImageIdsFromMarkdown(markdown);

			// Assert
			expect(imageIds).toEqual(["test-image-id-1"]);
		});

		it("Markdownから複数の画像IDを抽出する", () => {
			// Arrange
			const markdown = `
# タイトル

![画像1](https://imagedelivery.net/abc123/test-image-id-1/medium)

本文...

![画像2](https://imagedelivery.net/abc123/test-image-id-2/large)

![画像3](https://imagedelivery.net/abc123/test-image-id-3/xlarge)
			`;

			// Act
			const imageIds = extractImageIdsFromMarkdown(markdown);

			// Assert
			expect(imageIds).toEqual([
				"test-image-id-1",
				"test-image-id-2",
				"test-image-id-3",
			]);
		});

		it("重複する画像IDを除去する", () => {
			// Arrange
			const markdown = `
![画像1](https://imagedelivery.net/abc123/test-image-id-1/medium)

![画像1（再利用）](https://imagedelivery.net/abc123/test-image-id-1/large)

![画像2](https://imagedelivery.net/abc123/test-image-id-2/medium)

![画像1（再々利用）](https://imagedelivery.net/abc123/test-image-id-1/xlarge)
			`;

			// Act
			const imageIds = extractImageIdsFromMarkdown(markdown);

			// Assert
			expect(imageIds).toEqual(["test-image-id-1", "test-image-id-2"]);
		});

		it("Markdown内に画像がない場合、空配列を返す", () => {
			// Arrange
			const markdown = `
# タイトル

本文のみで画像はありません。
			`;

			// Act
			const imageIds = extractImageIdsFromMarkdown(markdown);

			// Assert
			expect(imageIds).toEqual([]);
		});

		it("外部の画像URLを無視する", () => {
			// Arrange
			const markdown = `
![Cloudflare Images](https://imagedelivery.net/abc123/test-image-id-1/medium)

![External Image](https://example.com/image.jpg)

![Another External](https://cdn.example.com/photo.png)
			`;

			// Act
			const imageIds = extractImageIdsFromMarkdown(markdown);

			// Assert
			// 外部URLは無視され、Cloudflare ImagesのURLのみ抽出される
			expect(imageIds).toEqual(["test-image-id-1"]);
		});

		it("空のMarkdownを処理する", () => {
			// Arrange
			const markdown = "";

			// Act
			const imageIds = extractImageIdsFromMarkdown(markdown);

			// Assert
			expect(imageIds).toEqual([]);
		});

		it("異なるバリアントの画像IDを抽出する", () => {
			// Arrange
			const markdown = `
![Small](https://imagedelivery.net/hash1/id-1/small)
![Medium](https://imagedelivery.net/hash2/id-2/medium)
![Large](https://imagedelivery.net/hash3/id-3/large)
![XLarge](https://imagedelivery.net/hash4/id-4/xlarge)
			`;

			// Act
			const imageIds = extractImageIdsFromMarkdown(markdown);

			// Assert
			expect(imageIds).toEqual(["id-1", "id-2", "id-3", "id-4"]);
		});

		it("コードブロックを含む複雑なMarkdownから画像IDを抽出する", () => {
			// Arrange
			const markdown = `
# タイトル

コードブロック:
\`\`\`javascript
const url = "https://imagedelivery.net/abc123/not-real-id/medium";
console.log(url);
\`\`\`

実際の画像:
![Real Image](https://imagedelivery.net/abc123/real-image-id/medium)
			`;

			// Act
			const imageIds = extractImageIdsFromMarkdown(markdown);

			// Assert
			// コードブロック内のURLも抽出される（Markdownパースはしない）
			expect(imageIds).toEqual(["not-real-id", "real-image-id"]);
		});
	});
});
