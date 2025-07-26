const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@saneatsu/i18n", "@saneatsu/schemas"],
	// OpenNext Cloudflare adapter configuration
	experimental: {
		serverComponentsExternalPackages: ["@libsql/client"],
	},
	// Ensure edge runtime compatibility
	images: {
		unoptimized: true,
	},
};

module.exports = withNextIntl(nextConfig);
