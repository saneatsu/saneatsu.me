import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";

import styles from "./index.module.css";

/**
 * ホームページのヒーローセクション
 */
function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();
	return (
		<header className={clsx("hero hero--primary", styles.heroBanner)}>
			<div className="container">
				<Heading as="h1" className="hero__title">
					{siteConfig.title}
				</Heading>
				<p className="hero__subtitle">{siteConfig.tagline}</p>
				<div className={styles.buttons}>
					{(Link as any)({
						className: "button button--secondary button--lg",
						to: "/docs/intro",
						children: "Get Started - 5min ⏱️"
					})}
				</div>
			</div>
		</header>
	);
}

/**
 * 特徴セクションの項目データ
 */
type FeatureItem = {
	title: string;
	Svg: React.ComponentType<React.ComponentProps<"svg">>;
	description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
	{
		title: "Modern Tech Stack",
		Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
		description: (
			<>
				Next.js 15, React 19, TypeScript, Hono, Drizzle ORM を使用した
				モダンなフルスタック構成で構築されています。
			</>
		),
	},
	{
		title: "Feature-Sliced Design",
		Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
		description: (
			<>
				スケーラブルで保守性の高いアーキテクチャとして Feature-Sliced Design
				を採用しています。
			</>
		),
	},
	{
		title: "Comprehensive Testing",
		Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
		description: (
			<>
				Vitest、Storybook、Playwright を使用した
				包括的なテスト戦略で品質を保証しています。
			</>
		),
	},
];

/**
 * 特徴セクションの個別項目コンポーネント
 */
function Feature({ title, Svg, description }: FeatureItem) {
	return (
		<div className={clsx("col col--4")}>
			<div className="text--center">
				<Svg className={styles.featureSvg} role="img" />
			</div>
			<div className="text--center padding-horiz--md">
				<Heading as="h3">{title}</Heading>
				<p>{description}</p>
			</div>
		</div>
	);
}

/**
 * ホームページの特徴セクション
 */
function HomepageFeatures(): JSX.Element {
	return (
		<section className={styles.features}>
			<div className="container">
				<div className="row">
					{FeatureList.map((props) => (
						<Feature key={props.title} {...props} />
					))}
				</div>
			</div>
		</section>
	);
}

/**
 * ホームページのメインコンポーネント
 */
export default function Home(): JSX.Element {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout
			title={`Hello from ${siteConfig.title}`}
			description="Comprehensive documentation for saneatsu.me project"
		>
			<HomepageHeader />
			<main>
				<HomepageFeatures />
			</main>
		</Layout>
	);
}
