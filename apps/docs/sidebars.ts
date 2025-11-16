import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
	// By default, Docusaurus generates a sidebar from the docs folder structure
	tutorialSidebar: [
		"intro",
		{
			type: "category",
			label: "Getting Started",
			items: ["getting-started/setup"],
		},
		{
			type: "category",
			label: "Tech Stack",
			items: [
				"tech-stack/overview",
				"tech-stack/frontend",
				"tech-stack/backend",
			],
		},
		{
			type: "category",
			label: "Architecture",
			items: ["architecture/overview", "architecture/feature-sliced-design"],
		},
		{
			type: "category",
			label: "API",
			items: ["api/overview", "api/articles"],
		},
		{
			type: "category",
			label: "Testing",
			items: [
				"testing/overview",
				"testing/vitest",
				"testing/storybook",
				"testing/playwright",
			],
		},
		{
			type: "category",
			label: "Development",
			items: [
				"development/coding-standards",
				"development/commit-conventions",
				"development/database",
				"development/content-authoring",
				"development/ogp-preview",
			],
		},
		{
			type: "category",
			label: "Features",
			items: ["features/internationalization"],
		},
		{
			type: "category",
			label: "Deployment",
			items: [
				"deployment/overview",
				"deployment/ci-cd",
				"deployment/environment-variables",
				"deployment/cloudflare-images",
			],
		},
		// Additional docs will be added as we create them
	],
};

export default sidebars;
