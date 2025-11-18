import type React from "react";

const BACKGROUND_STYLES = {
	background: "#0a0a0a",
	backgroundImage: `
		linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
		linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
		linear-gradient(45deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.04) 75%, rgba(255, 255, 255, 0.04)),
		linear-gradient(-45deg, rgba(255, 255, 255, 0.04) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.04) 75%, rgba(255, 255, 255, 0.04))
	`,
	backgroundSize: "40px 40px, 40px 40px, 80px 80px, 80px 80px",
	backgroundPosition: "0 0, 0 0, 0 0, 40px 40px",
};

const BASE_LAYOUT_STYLES = {
	height: "100%",
	width: "100%",
	display: "flex",
	flexDirection: "column" as const,
	alignItems: "center",
	justifyContent: "center",
	padding: "80px",
	position: "relative" as const,
	overflow: "hidden" as const,
};

export interface OgImageLayoutProps {
	children: React.ReactNode;
	backgroundImage?: ArrayBuffer | null;
}

export function OgImageLayout({
	children,
	backgroundImage,
}: OgImageLayoutProps) {
	// デバッグ用ログ
	console.log("🎨 OgImageLayout rendering");
	console.log("  - hasBackgroundImage:", !!backgroundImage);
	console.log("  - backgroundImageType:", typeof backgroundImage);
	if (backgroundImage) {
		console.log("  - backgroundImageSize:", backgroundImage.byteLength);
		console.log(
			"  - backgroundImageSizeKB:",
			Math.round(backgroundImage.byteLength / 1024)
		);
	}

	return (
		<div
			style={{
				...BASE_LAYOUT_STYLES,
				...(backgroundImage ? { background: "#050505" } : BACKGROUND_STYLES),
			}}
		>
			{backgroundImage ? (
				<>
					{/* next/og runtimeではnext/imageが利用できず、純粋なJSXのみ許可されているため */}
					{/* Satoriは内部でArrayBufferをdata URLに自動変換する（実行時に型チェックするため、型アサーションは実行時の動作に影響しない） */}
					{/* biome-ignore lint/performance/noImgElement: next/ogは画像タグ以外で背景を描画できない */}
					<img
						// biome-ignore lint/suspicious/noExplicitAny: 型アサーションは実行時に影響しない
						src={backgroundImage as any}
						alt="article background"
						width={1200}
						height={630}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							objectFit: "cover",
							filter: "brightness(0.4)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							background:
								"linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.6) 60%, rgba(0, 0, 0, 0.85) 100%)",
						}}
					/>
				</>
			) : null}
			<div
				style={{
					position: "relative",
					zIndex: 1,
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{children}
			</div>
		</div>
	);
}

export function SiteOgImageContent() {
	return (
		<OgImageLayout>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: "40px",
				}}
			>
				<div
					style={{
						fontSize: 96,
						fontWeight: 700,
						color: "white",
						textAlign: "center",
					}}
				>
					saneatsu.me
				</div>
				<div
					style={{
						fontSize: 40,
						color: "rgba(255, 255, 255, 0.9)",
						fontWeight: 400,
						textAlign: "center",
					}}
				>
					Tech & Lifestyle Blog
				</div>
			</div>
		</OgImageLayout>
	);
}

export interface ArticleOgImageContentProps {
	title: string;
	backgroundImage?: ArrayBuffer | null;
}

export function ArticleOgImageContent({
	title,
	backgroundImage,
}: ArticleOgImageContentProps) {
	const displayTitle = title.length > 80 ? `${title.slice(0, 80)}...` : title;

	return (
		<OgImageLayout backgroundImage={backgroundImage}>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					flex: 1,
					width: "100%",
				}}
			>
				<div
					style={{
						fontSize: 64,
						fontWeight: 700,
						color: "white",
						textAlign: "center",
						lineHeight: 1.2,
						wordWrap: "break-word",
						maxWidth: "90%",
					}}
				>
					{displayTitle}
				</div>
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 32,
					color: "rgba(255, 255, 255, 0.9)",
					fontWeight: 600,
				}}
			>
				saneatsu.me
			</div>
		</OgImageLayout>
	);
}
