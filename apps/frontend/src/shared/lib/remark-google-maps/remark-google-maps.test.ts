import { describe, expect, it } from "vitest";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

interface MarkdownTree {
	children?: any[];
}

import { remarkGoogleMaps } from "./remark-google-maps";

function transform(markdown: string): MarkdownTree {
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkGoogleMaps);
	const tree = processor.parse(markdown);
	return processor.runSync(tree) as MarkdownTree;
}

describe("remarkGoogleMaps", () => {
	it("単独行のGoogle Maps URLをgooglemapsノードに変換する", () => {
		const md = "https://www.google.com/maps/@35.6599,139.6932,13z";
		const tree = transform(md);
		const node = tree.children?.[0] as any;
		expect(node?.type).toBe("googlemaps");
		expect(node?.data?.hProperties).toMatchObject({
			coordinates: { lat: 35.6599, lng: 139.6932 },
			zoom: 13,
		});
	});

	it("qパラメータが座標の場合でも変換する", () => {
		const md = "https://www.google.com/maps?q=35.7,139.7";
		const tree = transform(md);
		const node = tree.children?.[0] as any;
		expect(node?.type).toBe("googlemaps");
		expect(node?.data?.hProperties?.coordinates).toMatchObject({
			lat: 35.7,
			lng: 139.7,
		});
	});

	it("placeパスからクエリ文言を抽出する", () => {
		const md =
			"https://www.google.com/maps/place/Chocolaterie+ROND-POINT/@35.6,139.6,12z";
		const tree = transform(md);
		const node = tree.children?.[0] as any;
		expect(node?.data?.hProperties?.query).toBe("Chocolaterie ROND-POINT");
	});

	it("文章中のリンクや非対応ホストは変換しない", () => {
		const md = "こちら https://example.com/maps/@1,1,1z です";
		const tree = transform(md);
		const paragraph = (tree.children?.[0] as any) ?? {};
		expect(paragraph.children?.[0]?.type).toBe("text");
	});

	it("Google公式iframeを貼り付けても安全にgooglemapsノードへ変換する", () => {
		const iframe = `
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12" width="600" height="450" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
`;
		const tree = transform(iframe);
		const node = tree.children?.[0] as any;
		expect(node?.type).toBe("googlemaps");
		expect(node?.data?.hProperties?.embedSrc).toContain(
			"https://www.google.com/maps/embed?pb="
		);
	});
});
