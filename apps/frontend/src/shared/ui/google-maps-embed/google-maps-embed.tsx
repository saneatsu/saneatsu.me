"use client";

import { useMemo, useState } from "react";

import { Skeleton } from "../skeleton/skeleton";

export type GoogleMapsMapType = "roadmap" | "satellite" | "terrain" | "hybrid";

export interface GoogleMapsEmbedProps {
	coordinates?: { lat: number; lng: number };
	query?: string;
	zoom?: number;
	mapType?: GoogleMapsMapType;
	language?: "ja" | "en";
	className?: string;
	embedSrc?: string;
}

const mapTypeMap: Record<GoogleMapsMapType, string> = {
	roadmap: "m",
	satellite: "k",
	terrain: "p",
	hybrid: "h",
};

function isAllowedEmbedSrc(src: string): string | null {
	try {
		const url = new URL(src);
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

export function GoogleMapsEmbed({
	embedSrc,
	coordinates,
	query,
	zoom = 13,
	mapType = "roadmap",
	language = "ja",
	className,
}: GoogleMapsEmbedProps) {
	const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");

	const src = useMemo(() => {
		if (embedSrc) {
			return isAllowedEmbedSrc(embedSrc);
		}
		const locationQuery = coordinates
			? `${coordinates.lat},${coordinates.lng}`
			: query;

		if (!locationQuery) return null;

		const params = new URLSearchParams({
			q: locationQuery,
			output: "embed",
			z: zoom.toString(),
			hl: language,
			t: mapTypeMap[mapType],
		});

		return `https://www.google.com/maps?${params.toString()}`;
	}, [coordinates, embedSrc, language, mapType, query, zoom]);

	if (!src) {
		return (
			<div className={className}>
				<MapError message="Google MapsのURLを解析できませんでした" />
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className={className}>
				<MapError message="Google Mapsを読み込めませんでした" href={src} />
			</div>
		);
	}

	return (
		<div className={className}>
			<div className="flex justify-center my-6">
				<div className="w-full max-w-3xl">
					<div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
						{status !== "ready" && <MapSkeleton />}
						<iframe
							src={src}
							title="Google Maps"
							className="absolute top-0 left-0 h-full w-full rounded-lg border border-border bg-muted"
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
							onLoad={() => setStatus("ready")}
							onError={() => setStatus("error")}
							allowFullScreen
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function MapSkeleton() {
	return (
		<div className="absolute inset-0">
			<Skeleton className="h-full w-full rounded-lg" />
		</div>
	);
}

function MapError({ message, href }: { message: string; href?: string }) {
	return (
		<div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
			<p>{message}</p>
			{href && (
				<a
					href={href}
					target="_blank"
					rel="noreferrer"
					className="text-primary underline underline-offset-4"
				>
					Google Mapsで開く
				</a>
			)}
		</div>
	);
}
