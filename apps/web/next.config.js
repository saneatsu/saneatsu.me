const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@saneatsu/i18n", "@saneatsu/schemas", "react-tweet"],
	// Disable type checking for backend package during build
	typescript: {
		ignoreBuildErrors: false,
	},
	// OpenNext Cloudflare adapter configuration
	serverExternalPackages: ["@libsql/client", "@saneatsu/backend"],
	// Ensure edge runtime compatibility
	images: {
		unoptimized: true,
	},
	// Environment variables for Edge Runtime (Cloudflare Workers)
	// These will be replaced at build time
	env: {
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
		NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH:
			process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		ADMIN_EMAILS: process.env.ADMIN_EMAILS,
		BASIC_AUTH_USER: process.env.BASIC_AUTH_USER,
		BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,
		AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
	},
	// Webpack設定でファイルウォッチャーの監視対象を制限
	webpack: (config) => {
		// ファイルウォッチャーの設定を追加して、不要なファイルを監視対象から除外
		config.watchOptions = {
			ignored: [
				"**/node_modules/**",
				"**/.git/**",
				"**/.next/**",
				"**/dist/**",
				"**/build/**",
				"**/.turbo/**",
				"**/coverage/**",
				"**/.storybook-static/**",
			],
			// ポーリング方式を使用してファイルウォッチャーの問題を回避
			poll: 1000,
		};
		return config;
	},
};

module.exports = withNextIntl(nextConfig);
