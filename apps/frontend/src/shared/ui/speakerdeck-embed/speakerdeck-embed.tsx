"use client";

import { useEffect, useMemo, useState } from "react";

import { Skeleton } from "../skeleton/skeleton";

export interface SpeakerDeckEmbedProps {
	url: string;
	slide?: number;
	className?: string;
}

interface SpeakerDeckOEmbedResponse {
	html: string;
	width?: number;
	height?: number;
	title?: string;
}

interface SpeakerDeckIframeState {
	src: string;
	title: string;
	allowFullScreen: boolean;
	width?: number;
	height?: number;
}

type FetchStatus = "idle" | "loading" | "ready" | "error";

/**
 * Speaker Deckのスライドを埋め込み表示
 *
 * Speaker Deckはiframe直リンク用のIDを公開していないため、
 * oEmbedエンドポイントを経由してiframe情報を取得し、表示する。
 */
export function SpeakerDeckEmbed({
	url,
	slide,
	className,
}: SpeakerDeckEmbedProps) {
	const [iframeState, setIframeState] = useState<SpeakerDeckIframeState | null>(
		null
	);
	const [status, setStatus] = useState<FetchStatus>("idle");

	useEffect(() => {
		let aborted = false;
		const controller = new AbortController();

		async function fetchOEmbed() {
			setStatus("loading");
			try {
				const params = new URLSearchParams({ url });
				if (slide !== undefined) {
					params.set("slide", slide.toString());
				}

				const response = await fetch(
					`/api/speakerdeck/oembed?${params.toString()}`,
					{ signal: controller.signal }
				);

				if (!response.ok) {
					throw new Error(`oEmbed request failed with ${response.status}`);
				}

				const data = (await response.json()) as SpeakerDeckOEmbedResponse;
				const iframeAttributes = extractIframeAttributes(data.html);

				if (!iframeAttributes) {
					throw new Error("Unable to parse Speaker Deck iframe");
				}

				if (aborted) return;
				setIframeState({
					...iframeAttributes,
					width: data.width,
					height: data.height,
				});
				setStatus("ready");
			} catch (error) {
				if (controller.signal.aborted) return;
				console.error("Failed to load Speaker Deck embed:", error);
				setStatus("error");
			}
		}

		void fetchOEmbed();

		return () => {
			aborted = true;
			controller.abort();
		};
	}, [slide, url]);

	const paddingBottom = useMemo(() => {
		if (iframeState?.width && iframeState.height) {
			return `${(iframeState.height / iframeState.width) * 100}%`;
		}
		// デフォルトは4:3相当
		return "75%";
	}, [iframeState]);

	const iframeSrc = useMemo(() => {
		if (!iframeState) return undefined;
		const normalizedSrc = normalizeSpeakerDeckSrc(iframeState.src);
		if (!slide) return normalizedSrc;
		try {
			const urlObject = new URL(normalizedSrc);
			urlObject.searchParams.set("slide", slide.toString());
			return urlObject.toString();
		} catch {
			return normalizedSrc;
		}
	}, [iframeState, slide]);

	if (status === "loading" || status === "idle") {
		return <SpeakerDeckSkeleton className={className} />;
	}

	if (status === "error" || !iframeSrc || !iframeState) {
		return (
			<div className={className}>
				<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
					<p>Speaker Deckの読み込みに失敗しました。</p>
					<a
						href={url}
						target="_blank"
						rel="noreferrer"
						className="text-primary underline underline-offset-4"
					>
						{url}
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className={className}>
			<div className="flex justify-center my-6">
				<div className="w-full max-w-3xl">
					<div className="relative w-full" style={{ paddingBottom }}>
						<iframe
							src={iframeSrc}
							title={iframeState.title || "Speaker Deck presentation"}
							className="absolute top-0 left-0 h-full w-full rounded-lg border border-border bg-background"
							allowFullScreen={iframeState.allowFullScreen}
							scrolling="no"
							loading="lazy"
							referrerPolicy="strict-origin-when-cross-origin"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function SpeakerDeckSkeleton({ className }: { className?: string }) {
	return (
		<div className={className}>
			<div className="flex justify-center my-6">
				<div className="w-full max-w-3xl">
					<div className="relative w-full" style={{ paddingBottom: "75%" }}>
						<Skeleton className="absolute top-0 left-0 h-full w-full rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	);
}

function extractIframeAttributes(html: string): SpeakerDeckIframeState | null {
	const srcMatch = html.match(/src="([^"]+)"/);
	if (!srcMatch) return null;

	const titleMatch = html.match(/title="([^"]+)"/);
	const allowFullScreen = /allowfullscreen/i.test(html);

	return {
		src: srcMatch[1],
		title: titleMatch?.[1] ?? "Speaker Deck presentation",
		allowFullScreen,
	};
}

function normalizeSpeakerDeckSrc(src: string): string {
	if (src.startsWith("//")) {
		return `https:${src}`;
	}
	return src;
}
