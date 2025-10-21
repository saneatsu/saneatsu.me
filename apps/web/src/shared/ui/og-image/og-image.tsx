import { ImageResponse } from "next/og";

/**
 * OG画像の共通サイズ
 */
export const OG_IMAGE_SIZE = {
	width: 1200,
	height: 630,
};

/**
 * OG画像の共通alt属性
 */
export const OG_IMAGE_ALT = "saneatsu.me";

/**
 * OG画像の共通Content-Type
 */
export const OG_IMAGE_CONTENT_TYPE = "image/png";

/**
 * 共通のグラデーション背景スタイル
 */
const GRADIENT_BACKGROUND = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

/**
 * OG画像の共通レイアウトコンポーネント
 *
 * @description
 * OG画像の共通レイアウト（背景、パディング、中央配置）を提供する。
 *
 * @param props.children - レイアウト内に表示するコンテンツ
 */
function OgImageLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: GRADIENT_BACKGROUND,
				padding: "80px",
			}}
		>
			{children}
		</div>
	);
}

/**
 * サイト用OG画像コンテンツコンポーネント
 *
 * @description
 * ホームページやデフォルトページ用のOG画像コンテンツを表示する。
 * "saneatsu.me" + "Tech & Lifestyle Blog" のテキストを表示。
 */
function SiteOgImageContent() {
	return (
		<OgImageLayout>
			{/* サイト名 */}
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

				{/* サブタイトル */}
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

/**
 * サイト用のOG画像を生成
 *
 * @description
 * ホームページやデフォルトページ用のOG画像を生成する。
 * "saneatsu.me" + "Tech & Lifestyle Blog" のテキストを表示。
 *
 * @returns ImageResponse - 生成されたOG画像
 */
export function SiteOgImage() {
	return new ImageResponse(<SiteOgImageContent />, {
		...OG_IMAGE_SIZE,
	});
}

/**
 * 記事用OG画像コンテンツコンポーネント
 *
 * @description
 * 記事ページ用のOG画像コンテンツを表示する。
 * 記事タイトルを表示し、80文字を超える場合は切り詰める。
 *
 * @param props.title - 記事タイトル（80文字を超える場合は自動的に切り詰められる）
 */
function ArticleOgImageContent({ title }: { title: string }) {
	// タイトルが長すぎる場合は切り詰める（80文字まで）
	const displayTitle = title.length > 80 ? `${title.slice(0, 80)}...` : title;

	return (
		<OgImageLayout>
			{/* 記事タイトル */}
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

			{/* サイト名 */}
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

/**
 * 記事用のOG画像を生成
 *
 * @description
 * 記事ページ用のOG画像を生成する。
 * 記事タイトルを表示し、80文字を超える場合は切り詰める。
 *
 * @param title - 記事タイトル（80文字を超える場合は自動的に切り詰められる）
 * @returns ImageResponse - 生成されたOG画像
 */
export function ArticleOgImage(title: string) {
	return new ImageResponse(<ArticleOgImageContent title={title} />, {
		...OG_IMAGE_SIZE,
	});
}
