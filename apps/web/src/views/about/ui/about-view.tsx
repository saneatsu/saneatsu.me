"use client";

import { useTranslations } from "next-intl";
import type { SimpleIcon } from "simple-icons";
import {
	siCloudflare,
	siCss,
	siDart,
	siDocker,
	siDrizzle,
	siFlask,
	siFlutter,
	siGit,
	siGithub,
	siGithubactions,
	siGooglebigquery,
	siHono,
	siJavascript,
	siMantine,
	siMui,
	siNextdotjs,
	siNodedotjs,
	siNotion,
	siNuxt,
	siPinia,
	siPostgresql,
	siPrisma,
	siPython,
	siRadixui,
	siReact,
	siRemix,
	siSass,
	siSlack,
	siSqlite,
	siStorybook,
	siStripe,
	siTailwindcss,
	siTypescript,
	siVercel,
	siVite,
	siVuedotjs,
	siX,
	siZenn,
} from "simple-icons";

import { BadgeWithIcon } from "@/shared/ui";

/**
 * 技術アイテムの型定義
 */
type TechItem = {
	name: string;
	icon: SimpleIcon;
};

/**
 * SNS・Webサイトアイテムの型定義
 */
type SocialItem = {
	name: string;
	icon: SimpleIcon;
	url: string;
	username: string;
};

/**
 * Aboutページのメインビューコンポーネント
 *
 * @description
 * 技術スタック、経歴、連絡先情報を表示する。
 * 日英両言語に対応し、レスポンシブデザインを採用。
 */
export function AboutView() {
	const t = useTranslations("about");

	// 技術スタックの定義（アイコン付き）
	const techStack: {
		languages: TechItem[];
		frameworks: TechItem[];
		databases: TechItem[];
		tools: TechItem[];
	} = {
		languages: [
			{ name: "TypeScript", icon: siTypescript },
			{ name: "JavaScript", icon: siJavascript },
			{ name: "Python", icon: siPython },
			{ name: "Dart", icon: siDart },
		],
		frameworks: [
			{ name: "React", icon: siReact },
			{ name: "Next.js", icon: siNextdotjs },
			{ name: "Vue.js", icon: siVuedotjs },
			{ name: "Nuxt", icon: siNuxt },
			{ name: "Remix", icon: siRemix },
			{ name: "Flutter", icon: siFlutter },
			{ name: "CSS", icon: siCss },
			{ name: "Sass", icon: siSass },
			{ name: "Tailwind CSS", icon: siTailwindcss },
			{ name: "MUI", icon: siMui },
			{ name: "Radix UI", icon: siRadixui },
			{ name: "Mantine", icon: siMantine },
			{ name: "Pinia", icon: siPinia },
			{ name: "Node.js", icon: siNodedotjs },
			{ name: "Hono", icon: siHono },
			{ name: "Flask", icon: siFlask },
			{ name: "Vite", icon: siVite },
			{ name: "Storybook", icon: siStorybook },
			{ name: "Drizzle ORM", icon: siDrizzle },
			{ name: "Prisma", icon: siPrisma },
		],
		databases: [
			{ name: "PostgreSQL", icon: siPostgresql },
			{ name: "SQLite", icon: siSqlite },
			{ name: "BigQuery", icon: siGooglebigquery },
		],
		tools: [
			{ name: "Git", icon: siGit },
			{ name: "GitHub", icon: siGithub },
			{ name: "GitHub Actions", icon: siGithubactions },
			{ name: "Vercel", icon: siVercel },
			{ name: "Cloudflare", icon: siCloudflare },
			{ name: "Docker", icon: siDocker },
			{ name: "Notion", icon: siNotion },
			{ name: "Slack", icon: siSlack },
			{ name: "Stripe", icon: siStripe },
		],
	};

	// SNS・Webサイトの定義（アイコン付き）
	const socialLinks: SocialItem[] = [
		{
			name: "GitHub",
			icon: siGithub,
			url: "https://github.com/saneatsu",
			username: "@saneatsu",
		},
		{
			name: "X (Twitter)",
			icon: siX,
			url: "https://twitter.com/saneatsu_wakana",
			username: "@saneatsu_wakana",
		},
		{
			name: "Zenn",
			icon: siZenn,
			url: "https://zenn.dev/saneatsu",
			username: "@saneatsu",
		},
	];

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto space-y-16">
				{/* タイトル */}
				<section className="text-center">
					<h1 className="text-4xl font-bold">{t("title")}</h1>
				</section>

				{/* コンテンツセクション */}
				<div className="space-y-12">
					{/* 技術セクション */}
					<section className="space-y-6 pb-12 border-b">
						<h2 className="text-2xl font-bold">{t("tech.title")}</h2>
						<div className="space-y-6">
							<div>
								<h3 className="text-lg font-semibold mb-3">
									{t("tech.languages.title")}
								</h3>
								<div className="flex flex-wrap gap-2">
									{techStack.languages.map((tech) => (
										<BadgeWithIcon
											key={tech.name}
											icon={tech.icon}
											text={tech.name}
										/>
									))}
								</div>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-3">
									{t("tech.frameworks.title")}
								</h3>
								<div className="flex flex-wrap gap-2">
									{techStack.frameworks.map((tech) => (
										<BadgeWithIcon
											key={tech.name}
											icon={tech.icon}
											text={tech.name}
										/>
									))}
								</div>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-3">
									{t("tech.databases.title")}
								</h3>
								<div className="flex flex-wrap gap-2">
									{techStack.databases.map((tech) => (
										<BadgeWithIcon
											key={tech.name}
											icon={tech.icon}
											text={tech.name}
										/>
									))}
								</div>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-3">
									{t("tech.tools.title")}
								</h3>
								<div className="flex flex-wrap gap-2">
									{techStack.tools.map((tech) => (
										<BadgeWithIcon
											key={tech.name}
											icon={tech.icon}
											text={tech.name}
										/>
									))}
								</div>
							</div>
						</div>
					</section>

					{/* 経歴セクション */}
					<section className="space-y-4 pb-12 border-b">
						<div>
							<h2 className="text-2xl font-bold mb-2">
								{t("experience.title")}
							</h2>
							<p className="text-muted-foreground">
								{t("experience.description")}
							</p>
						</div>
						<div className="space-y-6">
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("experience.current.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("experience.current.description")}
								</p>
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-2">
									{t("experience.focus.title")}
								</h3>
								<p className="text-muted-foreground">
									{t("experience.focus.description")}
								</p>
							</div>
						</div>
					</section>

					{/* SNS・Webサイトセクション */}
					<section className="space-y-4">
						<h2 className="text-2xl font-bold">{t("contact.title")}</h2>
						<div className="flex flex-wrap gap-2">
							{socialLinks.map((social) => (
								<a
									key={social.name}
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-block transition-opacity hover:opacity-80"
								>
									<BadgeWithIcon icon={social.icon} text={social.username} />
								</a>
							))}
						</div>
						<div className="text-muted-foreground">
							<p>
								Email:{" "}
								<a
									href="mailto:nito.tech.official@gmail.com"
									className="text-foreground hover:underline"
								>
									nito.tech.official@gmail.com
								</a>
							</p>
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
