const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['@saneatsu/i18n', '@saneatsu/schemas'],
};

module.exports = withNextIntl(nextConfig);