import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

interface TextNode extends Node {
	type: "text";
	value: string;
}

interface LinkNode extends Node {
	type: "link";
	url: string;
	children: Node[];
}

interface ParagraphNode extends Node {
	type: "paragraph";
	children: Node[];
}

interface HtmlNode extends Node {
	type: "html";
	value: string;
}

interface ParentNode extends Node {
	children: Node[];
}

interface GoogleMapsNode extends Node {
	type: "googlemaps";
	data: {
		hName: "googlemaps";
		hProperties: {
			coordinates?: { lat: number; lng: number };
			query?: string;
			zoom?: number;
			embedSrc?: string;
		};
	};
}


interface ParsedGoogleMapsInfo {
	coordinates?: { lat: number; lng: number };
	query?: string;
	zoom?: number;
	embedSrc?: string;
}

const SUPPORTED_PATH_PREFIX = "/maps";

const SUPPORTED_HOSTS = new Set([
	"www.google.com",
	"maps.google.com",
	"google.com",
]);

function isAutoLinkedUrl(linkNode: LinkNode): boolean {
	if (linkNode.children.length !== 1) return false;
	const child = linkNode.children[0];
	return child.type === "text" && (child as TextNode).value.trim() === linkNode.url;
}

function parseLatLng(value?: string | null): { lat: number; lng: number } | undefined {
	if (!value) return undefined;
	const [latString, lngString] = value.split(",");
	const lat = Number.parseFloat(latString);
	const lng = Number.parseFloat(lngString);
	if (Number.isFinite(lat) && Number.isFinite(lng)) {
		return { lat, lng };
	}
	return undefined;
}

function extractFromAtSegment(source: string): ParsedGoogleMapsInfo {
	const match = source.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)z/);
	if (!match) return {};
	const [, latString, lngString, zoomString] = match;
	const lat = Number.parseFloat(latString);
	const lng = Number.parseFloat(lngString);
	const zoom = Number.parseFloat(zoomString);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		return {};
	}
	return {
		coordinates: { lat, lng },
		zoom: Number.isFinite(zoom) ? zoom : undefined,
	};
}

function parseGoogleMapsUrl(url: URL): ParsedGoogleMapsInfo | null {
	if (!url.pathname.startsWith(SUPPORTED_PATH_PREFIX)) {
		return null;
	}

	const info: ParsedGoogleMapsInfo = {};

	const atInfo = extractFromAtSegment(url.href);
	if (atInfo.coordinates) {
		info.coordinates = atInfo.coordinates;
	}
	if (atInfo.zoom) {
		info.zoom = atInfo.zoom;
	}

	const ll = parseLatLng(url.searchParams.get("ll"));
	if (ll && !info.coordinates) {
		info.coordinates = ll;
	}

	const qParam = url.searchParams.get("q");
	if (qParam) {
		const latLng = parseLatLng(qParam);
		if (latLng) {
			info.coordinates = info.coordinates ?? latLng;
		} else {
			info.query = decodeURIComponent(qParam);
		}
	}

	if (!info.query) {
		// /place/<name>/...
		const pathSegments = url.pathname.split("/").filter(Boolean);
		const placeIndex = pathSegments.indexOf("place");
		if (placeIndex >= 0 && placeIndex + 1 < pathSegments.length) {
			info.query = decodeURIComponent(pathSegments[placeIndex + 1].replace(/\+/g, " "));
		}
	}

	if (!info.coordinates && !info.query) {
		return null;
	}

	return info;
}

function createGoogleMapsNode(info: ParsedGoogleMapsInfo): GoogleMapsNode {
	return {
		type: "googlemaps",
		data: {
			hName: "googlemaps",
			hProperties: {
				...(info.coordinates && { coordinates: info.coordinates }),
				...(info.query && { query: info.query }),
				...(info.zoom && { zoom: info.zoom }),
				...(info.embedSrc && { embedSrc: info.embedSrc }),
			},
		},
	};
}

function extractEmbedSrcFromHtml(value: string): string | null {
	const trimmed = value.trim();
	const iframeMatch = trimmed.match(/^<iframe\b([\s\S]*?)>(?:[\s\S]*?)<\/iframe>$/i);
	if (!iframeMatch) return null;
	const attributes = iframeMatch[1];
	const srcMatch = attributes.match(/src=["']([^"']+)["']/i);
	if (!srcMatch) return null;
	try {
		const url = new URL(srcMatch[1]);
		if (
			url.hostname.endsWith("google.com") &&
			url.pathname.startsWith("/maps/embed")
		) {
			return url.toString();
		}
		return null;
	} catch {
		return null;
	}
}

export const remarkGoogleMaps: Plugin = () => {
	return (tree: Node) => {
		visit(
			tree,
			"paragraph",
			(node: Node, index: number | undefined, parent: Node | undefined) => {
				if (!parent || index === undefined) return;

				const paragraphNode = node as ParagraphNode;

				if (paragraphNode.children.length !== 1) return;

				const child = paragraphNode.children[0];
				if (child.type !== "link") return;

				const linkNode = child as LinkNode;
				if (!isAutoLinkedUrl(linkNode)) return;

				let parsedUrl: URL;
				try {
					parsedUrl = new URL(linkNode.url);
				} catch {
					return;
				}

				if (!SUPPORTED_HOSTS.has(parsedUrl.hostname)) {
					return;
				}

				const info = parseGoogleMapsUrl(parsedUrl);
				if (!info) return;

				(parent as ParentNode).children[index] = createGoogleMapsNode(info);
			}
		);

		visit(
			tree,
			"html",
			(node: Node, index: number | undefined, parent: Node | undefined) => {
				if (!parent || index === undefined) return;
				const htmlNode = node as HtmlNode;
				const parsedEmbedSrc = extractEmbedSrcFromHtml(htmlNode.value);
				if (parsedEmbedSrc === null) return;
				(parent as ParentNode).children[index] = createGoogleMapsNode({
					embedSrc: parsedEmbedSrc,
				});
			}
		);
	};
};
