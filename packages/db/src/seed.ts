/**
 * データベースのシードデータ生成スクリプト（200件記事版）
 */
import dotenv from "dotenv";

// 環境変数をロード（最初に実行）
dotenv.config();

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import {
	articles,
	articleTags,
	articleTranslations,
	dailyArticleViews,
	tags,
	tagTranslations,
	users,
} from "./schema";

// シード用のデータベース接続（ローカルSQLite）
const client = createClient({
	url: "file:./local.db",
});

const db = drizzle(client, { schema });

/**
 * すべてのテーブルをクリアする
 */
async function clearAllTables() {
	console.log("🗑️  すべてのテーブルをクリア中...");

	try {
		// 外部キー制約を考慮して削除順序を設定
		await db.delete(articleTags);
		await db.delete(tagTranslations);
		await db.delete(tags);
		await db.delete(articleTranslations);
		await db.delete(dailyArticleViews);
		await db.delete(articles);
		await db.delete(users);

		console.log("✅ すべてのテーブルをクリアしました");
	} catch (error) {
		console.error("❌ テーブルクリア中にエラーが発生しました:", error);
		throw error;
	}
}

/**
 * ランダムなステータスを取得
 * published: 60%, draft: 30%, archived: 10%
 */
function getRandomStatus(): "published" | "draft" | "archived" {
	const rand = Math.random();
	if (rand < 0.6) return "published";
	if (rand < 0.9) return "draft";
	return "archived";
}

/**
 * ランダムな公開日時を取得（現在から360日前まで）
 */
function getRandomDate(): string | null {
	const now = new Date();
	const start = new Date(now);
	start.setDate(now.getDate() - 360); // 360日前

	const randomTime =
		start.getTime() + Math.random() * (now.getTime() - start.getTime());
	return new Date(randomTime).toISOString();
}

/**
 * ランダムなCloudflare画像IDを取得（50%の確率でnull）
 */
function getRandomImageId(): string | null {
	if (Math.random() < 0.5) return null;
	const imageIds = [
		"tech-hero-001",
		"development-002",
		"coding-003",
		"web-design-004",
		"database-005",
		"ai-ml-006",
		"lifestyle-007",
		"remote-work-008",
		"productivity-009",
		"tutorial-010",
	];
	return imageIds[Math.floor(Math.random() * imageIds.length)];
}

/**
 * 記事タイトルテンプレートを取得
 */
function getTitleTemplates() {
	const templates = [
		// 技術系
		"TypeScript実践テクニック {i}",
		"React開発ベストプラクティス {i}",
		"Next.js パフォーマンス最適化 {i}",
		"Webアプリケーション設計 {i}",
		"データベース設計入門 {i}",
		"AI・機械学習の基礎 {i}",
		"JavaScript ES2024新機能 {i}",
		"CSS Grid レイアウト {i}",
		"GraphQL API設計 {i}",
		"Docker コンテナ化 {i}",
		"AWS クラウド構築 {i}",
		"セキュリティ対策 {i}",
		"テスト駆動開発 {i}",
		"DevOps プラクティス {i}",
		"マイクロサービス設計 {i}",

		// ライフスタイル・ワークスタイル
		"リモートワーク効率化 {i}",
		"プログラマーの生活術 {i}",
		"開発者の健康管理 {i}",
		"エンジニアのキャリア {i}",
		"チーム開発のコツ {i}",
		"フリーランス体験記 {i}",
		"技術勉強法 {i}",
		"デジタルデトックス {i}",
		"ワークライフバランス {i}",
		"副業プログラミング {i}",

		// 開発・デザイン
		"UI/UXデザイン原則 {i}",
		"アクセシビリティ対応 {i}",
		"レスポンシブ デザイン {i}",
		"デザインシステム構築 {i}",
		"プロトタイピング手法 {i}",
		"ユーザビリティテスト {i}",
		"情報アーキテクチャ {i}",
		"カラーパレット設計 {i}",
		"タイポグラフィ選択 {i}",
		"アニメーション実装 {i}",
	];

	return templates;
}

/**
 * 英語タイトルテンプレートを取得
 */
function getEnglishTitleTemplates() {
	const templates = [
		// Tech
		"TypeScript Practical Techniques {i}",
		"React Development Best Practices {i}",
		"Next.js Performance Optimization {i}",
		"Web Application Architecture {i}",
		"Database Design Fundamentals {i}",
		"AI & Machine Learning Basics {i}",
		"JavaScript ES2024 New Features {i}",
		"CSS Grid Layout Guide {i}",
		"GraphQL API Design {i}",
		"Docker Containerization {i}",
		"AWS Cloud Infrastructure {i}",
		"Security Best Practices {i}",
		"Test-Driven Development {i}",
		"DevOps Practices {i}",
		"Microservices Architecture {i}",

		// Lifestyle & Work
		"Remote Work Productivity {i}",
		"Programmer's Lifestyle {i}",
		"Developer Health Management {i}",
		"Engineer Career Path {i}",
		"Team Development Tips {i}",
		"Freelance Experience {i}",
		"Tech Learning Methods {i}",
		"Digital Detox Guide {i}",
		"Work-Life Balance {i}",
		"Side Project Programming {i}",

		// Development & Design
		"UI/UX Design Principles {i}",
		"Accessibility Implementation {i}",
		"Responsive Design Guide {i}",
		"Design System Building {i}",
		"Prototyping Methods {i}",
		"Usability Testing {i}",
		"Information Architecture {i}",
		"Color Palette Design {i}",
		"Typography Selection {i}",
		"Animation Implementation {i}",
	];

	return templates;
}

/**
 * ランダムなコンテンツを生成
 */
function generateRandomContent(title: string, isJapanese: boolean): string {
	const sections = isJapanese
		? [
				"## はじめに\n\nこの記事では、{title}について詳しく解説します。",
				"## 基本的な概念\n\n基礎となる概念から理解を深めていきましょう。",
				"## 実践的な例\n\n```typescript\n// サンプルコード\nconst example = 'Hello World';\nconsole.log(example);\n```",
				"## ベストプラクティス\n\n- 適切な設計パターンを選択する\n- パフォーマンスを考慮した実装\n- 保守性の高いコードを書く",
				"## まとめ\n\n{title}について学んだ内容をまとめると、効率的な開発が可能になります。",
			]
		: [
				"## Introduction\n\nThis article provides a comprehensive guide to {title}.",
				"## Basic Concepts\n\nLet's start with the fundamental concepts you need to understand.",
				"## Practical Examples\n\n```typescript\n// Sample code\nconst example = 'Hello World';\nconsole.log(example);\n```",
				"## Best Practices\n\n- Choose appropriate design patterns\n- Consider performance in implementation\n- Write maintainable code",
				"## Conclusion\n\nBy learning about {title}, you can achieve more efficient development.",
			];

	return `# ${title}\n\n${sections.map((section) => section.replace("{title}", title.replace(/ \d+$/, ""))).join("\n\n")}`;
}

/**
 * ランダムな閲覧数を取得
 * 記事のステータス、人気度、公開日からの経過日数に応じて現実的な数値を生成
 */
function getRandomViewCount(
	status: "published" | "draft" | "archived",
	publishedAt: string | null,
	isPopular: boolean = false
): number {
	// 下書き記事は閲覧数が少ない
	if (status === "draft") {
		return Math.floor(Math.random() * 11); // 0-10回
	}

	// 公開日からの経過日数を計算
	let daysFromPublished = 0;
	if (publishedAt) {
		const published = new Date(publishedAt);
		const now = new Date();
		daysFromPublished = Math.floor(
			(now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
		);
	}

	// 経過日数による基本閲覧数の調整
	// 公開から時間が経つほど多くの人に読まれる傾向
	const daysFactor = Math.min(daysFromPublished / 30, 10); // 最大10倍まで

	// 人気記事（全体の5%）
	if (isPopular) {
		const baseViews = Math.floor(Math.random() * 1500) + 500; // 500-2000回
		return Math.floor(baseViews * (1 + daysFactor * 0.5)); // 経過日数で最大1.5倍
	}

	// 通常の記事
	if (status === "published") {
		const rand = Math.random();
		let baseViews = 0;

		if (rand < 0.25) {
			// 25%: あまり読まれていない記事
			baseViews = Math.floor(Math.random() * 51); // 0-50回
		} else {
			// 75%: 普通の記事
			baseViews = Math.floor(Math.random() * 490) + 10; // 10-500回
		}

		return Math.floor(baseViews * (1 + daysFactor * 0.3)); // 経過日数で最大1.3倍
	}

	// アーカイブ済み記事は過去に人気だった可能性
	if (status === "archived") {
		const baseViews = Math.floor(Math.random() * 800) + 100; // 100-900回
		return Math.floor(baseViews * (1 + daysFactor * 0.2)); // 経過日数で最大1.2倍
	}

	return 0; // fallback
}

/**
 * 記事の閲覧数を日別に分散する
 * 過去90日間の各日付に対して、現実的な閲覧数を計算
 *
 * @param publishedAt - 記事の公開日時
 * @param totalViews - 記事の総閲覧数
 * @param articleId - 記事ID（ランダムシード用）
 * @returns 日付ごとの閲覧数の配列
 */
function distributeDailyViews(
	publishedAt: string | null,
	totalViews: number,
	articleId: number
): Array<{ date: string; views: number }> {
	// 公開されていない、または閲覧数が0の記事は空配列を返す
	if (!publishedAt || totalViews === 0) {
		return [];
	}

	const result: Array<{ date: string; views: number }> = [];
	const publishedDate = new Date(publishedAt);
	const now = new Date();

	// 90日前の日付を計算
	const ninetyDaysAgo = new Date(now);
	ninetyDaysAgo.setDate(now.getDate() - 90);

	// データ生成の開始日を決定（公開日と90日前の新しい方）
	const startDate =
		publishedDate > ninetyDaysAgo ? publishedDate : ninetyDaysAgo;

	// 開始日から現在までの日数を計算（今日を含める）
	const daysSinceStart =
		Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) +
		1;

	if (daysSinceStart <= 0) {
		return [];
	}

	// 記事IDベースのシード（記事ごとに異なるパターン）
	let randomSeed = articleId * 7919;
	const seededRandom = () => {
		randomSeed = (randomSeed * 9301 + 49297) % 233280;
		return randomSeed / 233280;
	};

	// 閲覧数を日別に分散
	const currentDate = new Date(startDate);
	let remainingViews = totalViews;
	const decayFactor = 0.95; // 日々の減衰率

	for (let day = 0; day < daysSinceStart && remainingViews > 0; day++) {
		let dailyMultiplier = 1;

		// 公開直後のピーク（最初の3日間）
		if (day === 0) {
			dailyMultiplier = 2.5 + seededRandom(); // 2.5-3.5倍
		} else if (day === 1) {
			dailyMultiplier = 2.0 + seededRandom() * 0.5; // 2.0-2.5倍
		} else if (day === 2) {
			dailyMultiplier = 1.5 + seededRandom() * 0.5; // 1.5-2.0倍
		} else if (day < 7) {
			// 最初の週は緩やかに減少
			dailyMultiplier = 1.2 - (day - 3) * 0.1 + seededRandom() * 0.2;
		} else {
			// その後は指数関数的に減衰 + ランダム変動
			dailyMultiplier = decayFactor ** (day / 7) * (0.5 + seededRandom() * 0.5);
		}

		// 週末効果（土日は平日の70-80%）
		const dayOfWeek = currentDate.getDay();
		if (dayOfWeek === 0 || dayOfWeek === 6) {
			dailyMultiplier *= 0.7 + seededRandom() * 0.1;
		}

		// 月曜日は少し増える
		if (dayOfWeek === 1) {
			dailyMultiplier *= 1.1;
		}

		// 基本の1日あたり閲覧数
		const baseViewsPerDay = totalViews / Math.max(daysSinceStart, 1);
		const dailyViews = Math.max(
			1,
			Math.floor(baseViewsPerDay * dailyMultiplier)
		);

		// 残り閲覧数を超えないように調整
		const actualDailyViews = Math.min(dailyViews, remainingViews);

		if (actualDailyViews > 0) {
			const dateStr = currentDate.toISOString().split("T")[0];
			result.push({ date: dateStr, views: actualDailyViews });
			remainingViews -= actualDailyViews;
		}

		currentDate.setDate(currentDate.getDate() + 1);
	}

	// 残った閲覧数を全日に均等に分散（端数処理）
	if (remainingViews > 0 && result.length > 0) {
		const viewsPerDay = Math.floor(remainingViews / result.length);
		const extraViews = remainingViews % result.length;

		// 各日に均等に追加
		for (let i = 0; i < result.length; i++) {
			result[i].views += viewsPerDay;
			// 余りを最初の数日に分散
			if (i < extraViews) {
				result[i].views += 1;
			}
		}
	}

	return result;
}

async function seed() {
	console.log("🌱 200件シードデータの作成を開始します...");
	console.log("📅 記事の公開日: 現在から360日前まで、日別閲覧数: 過去90日間");

	try {
		// すべてのテーブルをクリア
		await clearAllTables();

		// ユーザーを作成
		await db
			.insert(users)
			.values({
				email: "test@example.com",
				name: "テストユーザー",
				avatarUrl: "https://github.com/identicons/test.png",
				provider: "google",
				providerId: "123456789",
			})
			.returning();
		console.log("✅ ユーザーを作成しました");

		// 200件の記事を生成
		console.log("📝 200件の記事を生成中...");

		const articleDefinitions = [];
		// 人気記事をランダムに選択（全体の5%）
		const popularArticleCount = Math.floor(200 * 0.05);
		const popularArticleIndices = new Set<number>();
		while (popularArticleIndices.size < popularArticleCount) {
			popularArticleIndices.add(Math.floor(Math.random() * 200));
		}

		for (let i = 1; i <= 200; i++) {
			const status = getRandomStatus();
			const publishedAt = status === "published" ? getRandomDate() : null;
			const isPopular = popularArticleIndices.has(i - 1);
			const viewCount = getRandomViewCount(status, publishedAt, isPopular);

			articleDefinitions.push({
				slug: `article-${i.toString().padStart(3, "0")}`,
				status,
				publishedAt,
				cfImageId: getRandomImageId(),
				viewCount,
			});
		}

		// 記事をバッチで挿入
		const articleData = await db
			.insert(articles)
			.values(articleDefinitions)
			.returning();

		console.log("✅ 200件の記事を作成しました");

		// 記事の翻訳を生成
		console.log("🌐 記事の翻訳を生成中...");

		const titleTemplatesJa = getTitleTemplates();
		const titleTemplatesEn = getEnglishTitleTemplates();

		const articleTranslationData = [];

		for (let i = 0; i < articleData.length; i++) {
			const article = articleData[i];

			// 日本語版
			const titleJa = titleTemplatesJa[i % titleTemplatesJa.length].replace(
				"{i}",
				(i + 1).toString()
			);

			articleTranslationData.push({
				articleId: article.id,
				title: titleJa,
				content: generateRandomContent(titleJa, true),
				language: "ja" as const,
			});

			// 英語版
			const titleEn = titleTemplatesEn[i % titleTemplatesEn.length].replace(
				"{i}",
				(i + 1).toString()
			);

			articleTranslationData.push({
				articleId: article.id,
				title: titleEn,
				content: generateRandomContent(titleEn, false),
				language: "en" as const,
			});
		}

		// 翻訳をバッチで挿入
		await db.insert(articleTranslations).values(articleTranslationData);
		console.log("✅ 400件の翻訳を作成しました");

		// タグを生成
		console.log("🏷️  タグを生成中...");

		const tagDefinitions = [
			{ slug: "typescript", ja: "TypeScript", en: "TypeScript" },
			{ slug: "react", ja: "React", en: "React" },
			{ slug: "nextjs", ja: "Next.js", en: "Next.js" },
			{ slug: "javascript", ja: "JavaScript", en: "JavaScript" },
			{ slug: "css", ja: "CSS", en: "CSS" },
			{ slug: "graphql", ja: "GraphQL", en: "GraphQL" },
			{ slug: "docker", ja: "Docker", en: "Docker" },
			{ slug: "aws", ja: "AWS", en: "AWS" },
			{ slug: "database", ja: "データベース", en: "Database" },
			{ slug: "security", ja: "セキュリティ", en: "Security" },
			{ slug: "testing", ja: "テスト", en: "Testing" },
			{ slug: "devops", ja: "DevOps", en: "DevOps" },
			{ slug: "design", ja: "デザイン", en: "Design" },
			{ slug: "lifestyle", ja: "ライフスタイル", en: "Lifestyle" },
			{ slug: "career", ja: "キャリア", en: "Career" },
			{ slug: "tutorial", ja: "チュートリアル", en: "Tutorial" },
			{
				slug: "best-practices",
				ja: "ベストプラクティス",
				en: "Best Practices",
			},
			{ slug: "performance", ja: "パフォーマンス", en: "Performance" },
			{ slug: "ui-ux", ja: "UI/UX", en: "UI/UX" },
			{ slug: "accessibility", ja: "アクセシビリティ", en: "Accessibility" },
		];

		// タグを挿入
		const tagData = await db
			.insert(tags)
			.values(tagDefinitions.map((tag) => ({ slug: tag.slug })))
			.returning();

		console.log(`✅ ${tagData.length}件のタグを作成しました`);

		// タグ翻訳を生成
		console.log("🌐 タグ翻訳を生成中...");

		const tagTranslationData = [];
		for (let i = 0; i < tagData.length; i++) {
			const tag = tagData[i];
			const tagDef = tagDefinitions[i];

			// 日本語の翻訳
			tagTranslationData.push({
				tagId: tag.id,
				name: tagDef.ja,
				language: "ja" as const,
			});

			// 英語の翻訳
			tagTranslationData.push({
				tagId: tag.id,
				name: tagDef.en,
				language: "en" as const,
			});
		}

		// タグ翻訳を挿入
		await db.insert(tagTranslations).values(tagTranslationData);
		console.log(`✅ ${tagTranslationData.length}件のタグ翻訳を作成しました`);

		// 記事とタグを関連付け
		console.log("🔗 記事とタグを関連付け中...");

		const articleTagsData = [];

		// タグのスラッグとIDのマッピングを作成
		const tagSlugToId = new Map(
			tagData.map((tag, index) => [tagDefinitions[index].slug, tag.id])
		);

		// 各記事にタグを割り当て
		for (let i = 0; i < articleData.length; i++) {
			const article = articleData[i];
			const titleJa = titleTemplatesJa[i % titleTemplatesJa.length];

			// タイトルに基づいてタグを選択
			const articleTagSlugs: string[] = [];

			// 技術系タグの割り当て
			if (titleJa.includes("TypeScript")) articleTagSlugs.push("typescript");
			if (titleJa.includes("React")) articleTagSlugs.push("react");
			if (titleJa.includes("Next.js")) articleTagSlugs.push("nextjs");
			if (titleJa.includes("JavaScript")) articleTagSlugs.push("javascript");
			if (titleJa.includes("CSS")) articleTagSlugs.push("css");
			if (titleJa.includes("GraphQL")) articleTagSlugs.push("graphql");
			if (titleJa.includes("Docker")) articleTagSlugs.push("docker");
			if (titleJa.includes("AWS")) articleTagSlugs.push("aws");
			if (titleJa.includes("データベース")) articleTagSlugs.push("database");
			if (titleJa.includes("セキュリティ")) articleTagSlugs.push("security");
			if (titleJa.includes("テスト")) articleTagSlugs.push("testing");
			if (titleJa.includes("DevOps")) articleTagSlugs.push("devops");

			// カテゴリタグの割り当て
			if (titleJa.includes("デザイン") || titleJa.includes("UI/UX"))
				articleTagSlugs.push("design");
			if (titleJa.includes("リモートワーク") || titleJa.includes("ライフ"))
				articleTagSlugs.push("lifestyle");
			if (titleJa.includes("キャリア") || titleJa.includes("フリーランス"))
				articleTagSlugs.push("career");
			if (titleJa.includes("入門") || titleJa.includes("ガイド"))
				articleTagSlugs.push("tutorial");
			if (titleJa.includes("ベストプラクティス") || titleJa.includes("最適化"))
				articleTagSlugs.push("best-practices");
			if (titleJa.includes("パフォーマンス"))
				articleTagSlugs.push("performance");
			if (titleJa.includes("アクセシビリティ"))
				articleTagSlugs.push("accessibility");

			// タグが割り当てられなかった場合、ランダムに1-3個選択
			if (articleTagSlugs.length === 0) {
				const randomTagCount = Math.floor(Math.random() * 3) + 1; // 1-3個
				const availableTags = [...tagDefinitions];
				for (let j = 0; j < randomTagCount; j++) {
					const randomIndex = Math.floor(Math.random() * availableTags.length);
					articleTagSlugs.push(availableTags[randomIndex].slug);
					availableTags.splice(randomIndex, 1);
				}
			}

			// 重複を削除
			const uniqueTagSlugs = [...new Set(articleTagSlugs)];

			// article_tagsレコードを作成
			for (const tagSlug of uniqueTagSlugs) {
				const tagId = tagSlugToId.get(tagSlug);
				if (tagId) {
					articleTagsData.push({
						articleId: article.id,
						tagId: tagId,
					});
				}
			}
		}

		// 記事とタグの関連付けを挿入
		await db.insert(articleTags).values(articleTagsData);
		console.log(
			`✅ ${articleTagsData.length}件の記事-タグ関連付けを作成しました`
		);

		// 日別閲覧数を生成
		console.log("📊 日別閲覧数を生成中...");

		// すべての記事の日別閲覧数を計算
		const dailyViewsMap = new Map<string, number>();

		for (let i = 0; i < articleData.length; i++) {
			const article = articleData[i];

			// 記事全体の閲覧数を使用
			const articleViewCount = article.viewCount || 0;

			// 記事の閲覧数を日別に分散
			const dailyViews = distributeDailyViews(
				article.publishedAt,
				articleViewCount,
				article.id
			);

			// 日別閲覧数を合算
			for (const { date, views } of dailyViews) {
				const currentViews = dailyViewsMap.get(date) || 0;
				dailyViewsMap.set(date, currentViews + views);
			}
		}

		// daily_article_viewsテーブルに挿入
		const dailyViewsData = Array.from(dailyViewsMap.entries()).map(
			([date, viewCount]) => ({
				date,
				viewCount,
			})
		);

		// 日付順にソート
		dailyViewsData.sort((a, b) => a.date.localeCompare(b.date));

		await db.insert(dailyArticleViews).values(dailyViewsData);
		console.log(`✅ ${dailyViewsData.length}件の日別閲覧数を作成しました`);

		console.log("🎉 200件シードデータの作成が完了しました！");

		// 閲覧数の統計を計算
		const totalViewCount = articleData.reduce(
			(sum, article) => sum + (article.viewCount || 0),
			0
		);
		const popularCount = popularArticleIndices.size;
		const avgViewCount = Math.round(totalViewCount / articleData.length);

		console.log(`
📊 作成されたデータ:
- ユーザー: 1件
- 記事: ${articleData.length}件（公開日: 過去360日間に分散、viewCount付き）
- 記事翻訳: ${articleTranslationData.length}件
- タグ: ${tagData.length}件
- タグ翻訳: ${tagTranslationData.length}件（日本語・英語）
- 記事-タグ関連付け: ${articleTagsData.length}件
- 日別閲覧数: ${dailyViewsData.length}件（過去90日間の日別データ）

📈 閲覧数統計:
- 合計閲覧数: ${totalViewCount.toLocaleString()}回（記事全体）
- 平均閲覧数: ${avgViewCount}回/記事
- 人気記事数: ${popularCount}件（全体の5%）
- 閲覧数は記事全体でカウントされ、公開日からの経過日数を考慮して生成
- 日別閲覧数は過去90日間の現実的なパターン（公開直後ピーク、週末効果）で分散
		`);
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

// スクリプトを実行
seed().catch(console.error);
