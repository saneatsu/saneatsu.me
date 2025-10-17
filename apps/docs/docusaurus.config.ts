import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
	title: "saneatsu.me",
	tagline: "Comprehensive documentation for saneatsu.me project",
	favicon: "img/favicon.ico",

	// Set the production url of your site here
	url: "https://docs.saneatsu.me",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "saneatsu", // Usually your GitHub org/user name.
	projectName: "saneatsu.me", // Usually your repo name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "ja",
		locales: ["ja", "en"],
		localeConfigs: {
			ja: {
				label: "日本語",
				direction: "ltr",
				htmlLang: "ja",
				calendar: "gregory",
			},
			en: {
				label: "English",
				direction: "ltr",
				htmlLang: "en",
				calendar: "gregory",
			},
		},
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
					editUrl:
						"https://github.com/saneatsu/saneatsu.me/tree/main/apps/docs/",
				},
				blog: false, // Disable blog for now
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],

	themeConfig: {
		// Replace with your project's social card
		image: "img/docusaurus-social-card.jpg",
		navbar: {
			title: "saneatsu.me docs",
			logo: {
				alt: "saneatsu.me Logo",
				src: "img/logo.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "tutorialSidebar",
					position: "left",
					label: "Documentation",
				},
				{
					href: "https://github.com/saneatsu/saneatsu.me",
					label: "GitHub",
					position: "right",
				},
				{
					type: "localeDropdown",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Documentation",
					items: [
						{
							label: "Introduction",
							to: "/docs/intro",
						},
					],
				},
				{
					title: "More",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/saneatsu/saneatsu.me",
						},
						{
							label: "Website",
							href: "https://saneatsu.me",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} saneatsu. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ["bash", "json", "typescript", "tsx", "jsx"],
		},
	} satisfies Preset.ThemeConfig,

	plugins: [
		function customWebpackConfig() {
			return {
				name: "custom-webpack-config",
				configureWebpack() {
					return {
						watchOptions: {
							ignored: [
								"**/node_modules/**",
								"**/.git/**",
								"**/.docusaurus/**",
								"**/dist/**",
								"**/build/**",
								"**/.turbo/**",
								"**/coverage/**",
							],
							// ポーリング方式を使用してファイルウォッチャーの問題を回避
							poll: 1000,
						},
					};
				},
			};
		},
	],
};

export default config;
