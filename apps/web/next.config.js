const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@saneatsu/i18n", "@saneatsu/schemas"],
	// OpenNext Cloudflare adapter configuration
	serverExternalPackages: ["@libsql/client"],
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
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		ADMIN_EMAILS: process.env.ADMIN_EMAILS,
		BASIC_AUTH_USER: process.env.BASIC_AUTH_USER,
		BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,
		AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
	},
};

module.exports = withNextIntl(nextConfig);
