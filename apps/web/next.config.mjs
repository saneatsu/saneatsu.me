/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// Turbopackを有効化（開発環境の高速化）
	turbopack: {},
	// 画像の最適化設定
	images: {
		domains: [],
		formats: ["image/avif", "image/webp"],
	},
	// 本番環境でソースマップを無効化
	productionBrowserSourceMaps: false,
	// TypeScriptとESLintのビルド時エラーを有効化
	typescript: {
		ignoreBuildErrors: false,
	},
	eslint: {
		ignoreDuringBuilds: false,
	},
};

export default nextConfig;