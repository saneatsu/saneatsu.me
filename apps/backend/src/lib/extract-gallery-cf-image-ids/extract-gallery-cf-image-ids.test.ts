import { describe, expect, it } from "vitest";

import { extractGalleryCfImageIds } from "./extract-gallery-cf-image-ids";

describe("extractGalleryCfImageIds", () => {
	describe("Unit Test", () => {
		it("should extract multiple gallery image IDs from Markdown", () => {
			const markdown = `
# Test Article

![Image 1](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-image-1/original)

Some text here.

![Image 2](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-image-2/large)
      `;

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual(["gallery-image-1", "gallery-image-2"]);
		});

		it("should extract a single gallery image ID", () => {
			const markdown =
				"![Tokyo Tower](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-tokyo-tower/xlarge)";

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual(["gallery-tokyo-tower"]);
		});

		it("should remove duplicate gallery image IDs", () => {
			const markdown = `
![Image 1](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-duplicate/original)
![Image 2](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-duplicate/large)
![Image 3](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-unique/small)
      `;

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual(["gallery-duplicate", "gallery-unique"]);
		});

		it("should return an empty array when no images are in Markdown", () => {
			const markdown = `
# Plain Text Article

This is just plain text without any images.

## Section 1

More text here.
      `;

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual([]);
		});

		it("should ignore external image URLs", () => {
			const markdown = `
![External Image](https://example.com/image.jpg)
![Gallery Image](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-internal/original)
![Another External](https://cdn.example.com/photo.png)
      `;

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual(["gallery-internal"]);
		});

		it("should handle empty Markdown", () => {
			const markdown = "";

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual([]);
		});

		it("should extract gallery image IDs with different variants", () => {
			const markdown = `
![Small](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-photo-1/small)
![Medium](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-photo-2/medium)
![Large](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-photo-3/large)
![XLarge](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-photo-4/xlarge)
![Original](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-photo-5/original)
      `;

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual([
				"gallery-photo-1",
				"gallery-photo-2",
				"gallery-photo-3",
				"gallery-photo-4",
				"gallery-photo-5",
			]);
		});

		it("should extract all image IDs regardless of prefix when mixed", () => {
			const markdown = `
![Content](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/content-blog-image/original)
![Gallery](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-sunset/large)
![Thumbnail](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/thumbnail-preview/small)
![Gallery 2](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-mountain/xlarge)
      `;

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual([
				"content-blog-image",
				"gallery-sunset",
				"thumbnail-preview",
				"gallery-mountain",
			]);
		});

		it("should extract gallery image IDs from complex Markdown with code blocks", () => {
			const markdown = `
# Article Title

Here's some code:

\`\`\`javascript
const imageUrl = "https://imagedelivery.net/xxx/fake-gallery/large";
console.log(imageUrl);
\`\`\`

And here's a real image:

![Real Gallery](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-real-image/original)

Inline code: \`https://imagedelivery.net/xxx/inline-fake/small\`

Another real image:

![Gallery 2](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/gallery-second-real/large)
      `;

			const result = extractGalleryCfImageIds(markdown);

			// コードブロック内の偽URLは除外され、実際のMarkdown画像のみが抽出される
			expect(result).toEqual(["gallery-real-image", "gallery-second-real"]);
		});

		it("should extract content- prefixed images", () => {
			const markdown = `
![Content Image 1](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/content-blog-image-1/original)
![Content Image 2](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/content-article-photo/large)
      `;

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual(["content-blog-image-1", "content-article-photo"]);
		});

		it("should extract images with custom prefixes like saneatsu-me_development_content_", () => {
			const markdown = `
![Tokyo Tower](https://imagedelivery.net/pQeNXC1P5ZVO1IiycNeISQ/saneatsu-me_development_content_7bb0eb42-4d0c-45ed-87b8-5b10ecf1ca3a/original)
      `;

			const result = extractGalleryCfImageIds(markdown);

			expect(result).toEqual([
				"saneatsu-me_development_content_7bb0eb42-4d0c-45ed-87b8-5b10ecf1ca3a",
			]);
		});
	});
});
