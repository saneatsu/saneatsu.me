const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@saneatsu/i18n", "@saneatsu/schemas"],
};

module.exports = withNextIntl(nextConfig);
