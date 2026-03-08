"use client";

import { Mail } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { SimpleIcon } from "simple-icons";
import {
	siAnaconda,
	siAsana,
	siBetterauth,
	siBiome,
	siCloudflare,
	siCss,
	siDart,
	siDependabot,
	siDjango,
	siDocker,
	siDotnet,
	siDrizzle,
	siExpo,
	siFastify,
	siFlask,
	siFlutter,
	siGit,
	siGithub,
	siGithubactions,
	siGooglebigquery,
	siGooglecloud,
	siHono,
	siHtml5,
	siJavascript,
	siKeras,
	siKonva,
	siLefthook,
	siMantine,
	siMui,
	siNextdotjs,
	siNodedotjs,
	siNotion,
	siNuxt,
	siOpencv,
	siPinia,
	siPostgresql,
	siPrettier,
	siPrimevue,
	siPrisma,
	siPython,
	siPytorch,
	siQiita,
	siRadixui,
	siReact,
	siReacthookform,
	siRemix,
	siRubyonrails,
	siSass,
	siSelenium,
	siShadcnui,
	siSqlite,
	siStorybook,
	siStripe,
	siSupabase,
	siTailwindcss,
	siTanstack,
	siTensorflow,
	siTestinglibrary,
	siTurso,
	siTypescript,
	siVercel,
	siVite,
	siVitest,
	siVuedotjs,
	siVuetify,
	siX,
	siXyflow,
	siZenn,
	siZod,
} from "simple-icons";

import type { ContributionCopy } from "@/features/contributions";
import {
	ContributionHeatmap,
	usePublicContributions,
} from "@/features/contributions";
import type { TimelineItem } from "@/shared/types";
import {
	AnchorHeading,
	BadgeWithIcon,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	StepperTimeline,
} from "@/shared/ui";

import { AboutAuthorSection } from "./about-author-section";
import { AboutBlogSection } from "./about-blog-section";
import { TimelineItemDetail } from "./timeline-item-detail";

/**
 * クエリパラメータ名の定数
 */
const COMPANY_QUERY_KEY = "company" as const;

/**
 * 技術アイテムの型定義
 */
type TechItem = {
	name: string;
	icon?: SimpleIcon;
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
	const experienceT = useTranslations("about.experience");
	const aboutContributionT = useTranslations("about.contributions");
	const contributionsT = useTranslations("contributions");
	const locale = useLocale();

	const contributionsCopy: ContributionCopy = {
		title: aboutContributionT("title"),
		subtitle: aboutContributionT("description"),
		rangeLabel: (days) => contributionsT("rangeLabel", { days }),
		summaryTotalJaChars: contributionsT("summary.totalJaChars"),
		legendLess: contributionsT("legend.less"),
		legendMore: contributionsT("legend.more"),
		error: contributionsT("error"),
		retry: contributionsT("retry"),
		metricJaCharsUnit: contributionsT("units.jaChars"),
	};

	const {
		data: publicContributions,
		isLoading: publicContributionsLoading,
		error: publicContributionsError,
		refetch: refetchPublicContributions,
	} = usePublicContributions({
		range: 365,
		locale: locale === "ja" ? "ja" : "en",
	});

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

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
			{ name: "HTML5", icon: siHtml5 },
			{ name: "CSS", icon: siCss },
			{ name: "Visual Basic", icon: siDotnet },
			{ name: "VBA", icon: siDotnet },
		],
		frameworks: [
			{ name: "React", icon: siReact },
			{ name: "Next.js", icon: siNextdotjs },
			{ name: "Vue.js", icon: siVuedotjs },
			{ name: "Nuxt", icon: siNuxt },
			{ name: "Remix", icon: siRemix },
			{ name: "React Native", icon: siReact },
			{ name: "Expo", icon: siExpo },
			{ name: "NativeWind", icon: siTailwindcss },
			{ name: "Flutter", icon: siFlutter },
			{ name: "Rails", icon: siRubyonrails },
			{ name: "Sass", icon: siSass },
			{ name: "Tailwind CSS", icon: siTailwindcss },
			{ name: "MUI", icon: siMui },
			{ name: "Vuetify", icon: siVuetify },
			{ name: "Radix UI", icon: siRadixui },
			{ name: "shadcn/ui", icon: siShadcnui },
			{ name: "Mantine", icon: siMantine },
			{ name: "PrimeVue", icon: siPrimevue },
			{ name: "Pinia", icon: siPinia },
			{ name: "Node.js", icon: siNodedotjs },
			{ name: "Hono", icon: siHono },
			{ name: "Fastify", icon: siFastify },
			{ name: "Flask", icon: siFlask },
			{ name: "Django", icon: siDjango },
			{ name: "PyTorch", icon: siPytorch },
			{ name: "TensorFlow", icon: siTensorflow },
			{ name: "Keras", icon: siKeras },
			{ name: "OpenCV", icon: siOpencv },
			{ name: "Vite", icon: siVite },
			{ name: "Vitest", icon: siVitest },
			{ name: "Testing Library", icon: siTestinglibrary },
			{ name: "Storybook", icon: siStorybook },
			{ name: "Playwright" },
			{ name: "Selenium", icon: siSelenium },
			{ name: "TanStack", icon: siTanstack },
			{ name: "Kysely" },
			{ name: "Drizzle ORM", icon: siDrizzle },
			{ name: "Prisma", icon: siPrisma },
			{ name: "Better Auth", icon: siBetterauth },
			{ name: "Zod", icon: siZod },
			{ name: "React Hook Form", icon: siReacthookform },
			{ name: "React Flow", icon: siXyflow },
			{ name: "Konva", icon: siKonva },
			{ name: "Lefthook", icon: siLefthook },
			{ name: "Biome", icon: siBiome },
			{ name: "Prettier", icon: siPrettier },
		],
		databases: [
			{ name: "PostgreSQL", icon: siPostgresql },
			{ name: "SQLite", icon: siSqlite },
			{ name: "Supabase", icon: siSupabase },
			{ name: "Turso", icon: siTurso },
			{ name: "BigQuery", icon: siGooglebigquery },
		],
		tools: [
			{ name: "Git", icon: siGit },
			{ name: "GitHub", icon: siGithub },
			{ name: "GitHub Actions", icon: siGithubactions },
			{ name: "Vercel", icon: siVercel },
			{ name: "Cloudflare", icon: siCloudflare },
			{ name: "AWS" },
			{ name: "Google Cloud", icon: siGooglecloud },
			{ name: "Docker", icon: siDocker },
			{ name: "Anaconda", icon: siAnaconda },
			{ name: "Notion", icon: siNotion },
			{ name: "Slack" },
			{ name: "Stripe", icon: siStripe },
			{ name: "Asana", icon: siAsana },
			{ name: "Dependabot", icon: siDependabot },
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
		{
			name: "Qiita",
			icon: siQiita,
			url: "https://qiita.com/saneatsu",
			username: "@saneatsu",
		},
	];

	// 経歴データの定義
	// 翻訳ファイルから経歴データを取得してTimelineItem型の配列に変換
	const timelineItems: TimelineItem[] = experienceT.raw(
		"timeline"
	) as TimelineItem[];

	// Sheetの状態管理
	const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	// タイムラインアイテムがクリックされたときのハンドラ
	const handleItemClick = (item: TimelineItem) => {
		setSelectedItem(item);
		setIsSheetOpen(true);

		// URLクエリに選択中のタイムラインアイテムのスラッグを追加
		const params = new URLSearchParams(searchParams.toString());
		params.set(COMPANY_QUERY_KEY, item.slug);
		const queryString = params.toString();

		router.push(queryString ? `${pathname}?${queryString}` : pathname, {
			scroll: false,
		});
	};

	// Sheetが閉じられたときのハンドラ
	const handleSheetClose = (open: boolean) => {
		setIsSheetOpen(open);
		if (!open) {
			// 選択を即座にクリア（アニメーション中でも問題なし）
			setSelectedItem(null);

			// URLクエリからタイムラインアイテムのスラッグを削除
			const params = new URLSearchParams(searchParams.toString());
			params.delete(COMPANY_QUERY_KEY);
			const queryString = params.toString();

			router.push(queryString ? `${pathname}?${queryString}` : pathname, {
				scroll: false,
			});
		}
	};

	// クエリパラメータからSheetの状態を復元
	useEffect(() => {
		const slug = searchParams.get(COMPANY_QUERY_KEY);
		if (!slug) {
			return;
		}

		const item = timelineItems.find((i) => i.slug === slug);
		if (!item) {
			return;
		}

		setSelectedItem(item);
		setIsSheetOpen(true);
	}, [searchParams, timelineItems]);

	/**
	 * ハイドレーション完了後にURLハッシュへ手動スクロール
	 *
	 * @description
	 * 本番環境でのみ発生するアンカースクロールの不具合を修正するためのワークアラウンド。
	 *
	 * 【なぜ本番でだけ発生するか】
	 * - 本番: Next.jsが静的HTMLを事前生成する。このコンポーネントはuseSearchParams()を使う
	 *   クライアントコンポーネントでSuspense内にあるため、静的HTMLにはSuspenseの
	 *   フォールバック（空）のみが含まれ、実際のコンテンツ（#author-interests等）は
	 *   JSバンドルのロード・ハイドレーション後に初めてDOMに追加される。
	 *   ブラウザのネイティブなハッシュスクロールはHTML解析時に1度だけ実行されるが、
	 *   この時点では対象要素がまだ存在しないため失敗し、ハイドレーション後に再試行もされない。
	 * - localhost: devモードでは毎リクエスト動的にサーバーレンダリングされ、
	 *   Suspenseも同期的に解決されるため、フルHTMLが返り要素が最初から存在する。
	 *   そのためブラウザのネイティブなハッシュスクロールが正常に動作する。
	 */
	useEffect(() => {
		const hash = window.location.hash;
		if (!hash) {
			return;
		}

		const id = hash.slice(1);
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "instant" });
		}
	}, []);

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto space-y-16">
				{/* タイトル */}
				<section className="text-center">
					<h1 className="text-4xl font-bold">{t("title")}</h1>
				</section>

				{/* ============================================ */}
				{/* ブログについてグループ */}
				{/* ============================================ */}
				<div className="space-y-16">
					{/* 執筆アクティビティ */}
					<section className="pt-4">
						<ContributionHeatmap
							summary={publicContributions}
							isLoading={publicContributionsLoading}
							error={publicContributionsError}
							onRetry={() => {
								void refetchPublicContributions();
							}}
							copy={contributionsCopy}
							locale={locale === "ja" ? "ja-JP" : "en-US"}
							rangeDays={publicContributions?.days.length ?? 365}
							headingId="contributions"
						/>
					</section>

					{/* このブログについて */}
					<AboutBlogSection />
				</div>

				{/* ============================================ */}
				{/* 自分についてグループ */}
				{/* ============================================ */}
				<div className="space-y-12">
					{/* 私について */}
					<AboutAuthorSection />

					{/* 経歴セクション */}
					<section className="space-y-6 pb-12 border-b">
						<AnchorHeading level="h2" id="experience" className="mb-2">
							{t("experience.title")}
						</AnchorHeading>
						<StepperTimeline
							items={timelineItems}
							onItemClick={handleItemClick}
							presentLabel={t("experience.detail.present")}
						/>
					</section>

					{/* 技術スタックセクション */}
					<section className="space-y-6 pb-12 border-b">
						<AnchorHeading level="h2" id="tech">
							{t("tech.title")}
						</AnchorHeading>
						<div className="space-y-6">
							<div>
								<AnchorHeading level="h3" id="tech-languages" className="mb-3">
									{t("tech.languages.title")}
								</AnchorHeading>
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
								<AnchorHeading level="h3" id="tech-frameworks" className="mb-3">
									{t("tech.frameworks.title")}
								</AnchorHeading>
								<div className="flex flex-wrap gap-2">
									{techStack.frameworks.map((tech) => (
										<BadgeWithIcon
											key={tech.name}
											icon={tech.icon}
											text={tech.name}
											backgroundColor={
												tech.name === "Kysely" ? "#7CE2FE" : undefined
											}
										/>
									))}
								</div>
							</div>
							<div>
								<AnchorHeading level="h3" id="tech-databases" className="mb-3">
									{t("tech.databases.title")}
								</AnchorHeading>
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
								<AnchorHeading level="h3" id="tech-tools" className="mb-3">
									{t("tech.tools.title")}
								</AnchorHeading>
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

					{/* SNS・連絡先セクション */}
					<section className="space-y-4">
						<AnchorHeading level="h2" id="contact">
							{t("contact.title")}
						</AnchorHeading>
						<div className="space-y-2">
							{socialLinks.map((social) => {
								// Zenn・Qiitaはブランドカラーを保持、GitHub・Xはダークモード対応
								const iconFill =
									social.name === "Zenn" || social.name === "Qiita"
										? `#${social.icon.hex}`
										: "currentColor";

								return (
									<div key={social.name}>
										<a
											href={social.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-foreground hover:underline"
										>
											<svg
												role="img"
												viewBox="0 0 24 24"
												className="h-4 w-4"
												fill={iconFill}
												aria-label={social.icon.title}
											>
												<title>{social.icon.title}</title>
												<path d={social.icon.path} />
											</svg>
											<span>
												{social.name}: {social.username}
												{social.name === "X (Twitter)" && (
													<span className="ml-1 text-sm text-muted-foreground">
														{t("contact.dmNote")}
													</span>
												)}
											</span>
										</a>
									</div>
								);
							})}
							<div>
								<a
									href="mailto:saneatsu.wakana@gmail.com"
									className="inline-flex items-center gap-2 text-foreground hover:underline"
								>
									<Mail className="h-4 w-4" />
									<span>Email: saneatsu.wakana@gmail.com</span>
								</a>
							</div>
						</div>
					</section>
				</div>
			</div>

			{/* 経歴詳細Sheet */}
			<Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
				<SheetContent className="overflow-y-auto w-[90vw] md:w-[80vw] md:max-w-[1000px]">
					<SheetHeader className="sr-only p-0">
						<SheetTitle>
							{selectedItem?.companyName ?? t("experience.detail.title")}
						</SheetTitle>
					</SheetHeader>
					{selectedItem && (
						<div className="px-6 py-4">
							<TimelineItemDetail item={selectedItem} />
						</div>
					)}
				</SheetContent>
			</Sheet>
		</main>
	);
}
