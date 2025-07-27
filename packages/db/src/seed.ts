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
	tags,
	tagTranslations,
	users,
} from "./schema";

// シード用のデータベース接続（直接作成）
const client = createClient({
	url: process.env.TURSO_DATABASE_URL || "",
	authToken: process.env.TURSO_AUTH_TOKEN || "",
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
		await db.delete(articleTranslations);
		await db.delete(tagTranslations);
		await db.delete(articles);
		await db.delete(tags);
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
 * ランダムな公開日時を取得（2023年〜2024年）
 */
function getRandomDate(): string | null {
	const start = new Date("2023-01-01").getTime();
	const end = new Date("2024-12-31").getTime();
	const randomTime = start + Math.random() * (end - start);
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
			"## まとめ\n\n{title}について学んだ内容をまとめると、効率的な開発が可能になります。"
		]
		: [
			"## Introduction\n\nThis article provides a comprehensive guide to {title}.",
			"## Basic Concepts\n\nLet's start with the fundamental concepts you need to understand.",
			"## Practical Examples\n\n```typescript\n// Sample code\nconst example = 'Hello World';\nconsole.log(example);\n```",
			"## Best Practices\n\n- Choose appropriate design patterns\n- Consider performance in implementation\n- Write maintainable code",
			"## Conclusion\n\nBy learning about {title}, you can achieve more efficient development."
		];

	return `# ${title}\n\n${sections.map(section => section.replace("{title}", title.replace(/ \d+$/, ""))).join("\n\n")}`;
}

/**
 * ランダムなタグIDを取得
 */
function getRandomTagIds(tagIds: number[], count: number = 2): number[] {
	const shuffled = [...tagIds].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
}

async function seed() {
	console.log("🌱 200件シードデータの作成を開始します...");

	try {
		// すべてのテーブルをクリア（一時的にスキップ）
		// await clearAllTables();

		// ユーザーを作成
		const [user] = await db
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

		// タグを作成
		const tagSlugs = [
			"tech",
			"life",
			"development",
			"web",
			"database",
			"ai",
			"design",
		];

		const tagData = await db
			.insert(tags)
			.values(tagSlugs.map(slug => ({ slug })))
			.returning();

		console.log("✅ タグを作成しました");

		// タグの翻訳を作成
		const tagTranslationData = [
			{ tagId: tagData[0].id, name: "技術", language: "ja" as const },
			{ tagId: tagData[0].id, name: "Technology", language: "en" as const },
			{ tagId: tagData[1].id, name: "ライフスタイル", language: "ja" as const },
			{ tagId: tagData[1].id, name: "Lifestyle", language: "en" as const },
			{ tagId: tagData[2].id, name: "開発", language: "ja" as const },
			{ tagId: tagData[2].id, name: "Development", language: "en" as const },
			{ tagId: tagData[3].id, name: "ウェブ", language: "ja" as const },
			{ tagId: tagData[3].id, name: "Web", language: "en" as const },
			{ tagId: tagData[4].id, name: "データベース", language: "ja" as const },
			{ tagId: tagData[4].id, name: "Database", language: "en" as const },
			{ tagId: tagData[5].id, name: "AI・機械学習", language: "ja" as const },
			{ tagId: tagData[5].id, name: "AI & ML", language: "en" as const },
			{ tagId: tagData[6].id, name: "デザイン", language: "ja" as const },
			{ tagId: tagData[6].id, name: "Design", language: "en" as const },
		];

		await db.insert(tagTranslations).values(tagTranslationData);
		console.log("✅ タグの翻訳を作成しました");

		// 200件の記事を生成
		console.log("📝 200件の記事を生成中...");
		
		const articleDefinitions = [];
		for (let i = 1; i <= 200; i++) {
			const status = getRandomStatus();
			articleDefinitions.push({
				slug: `article-${i.toString().padStart(3, '0')}`,
				status,
				publishedAt: status === "published" ? getRandomDate() : null,
				cfImageId: getRandomImageId(),
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
			const titleJa = titleTemplatesJa[i % titleTemplatesJa.length].replace("{i}", (i + 1).toString());
			articleTranslationData.push({
				articleId: article.id,
				title: titleJa,
				content: generateRandomContent(titleJa, true),
				language: "ja" as const,
			});
			
			// 英語版
			const titleEn = titleTemplatesEn[i % titleTemplatesEn.length].replace("{i}", (i + 1).toString());
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

		// 記事とタグの関連付け
		console.log("🔗 記事とタグを関連付け中...");
		
		const articleTagData = [];
		const tagIds = tagData.map(tag => tag.id);
		
		for (const article of articleData) {
			const randomTagIds = getRandomTagIds(tagIds, Math.floor(Math.random() * 3) + 1); // 1-3個のタグ
			for (const tagId of randomTagIds) {
				articleTagData.push({
					articleId: article.id,
					tagId,
				});
			}
		}

		await db.insert(articleTags).values(articleTagData);
		console.log(`✅ ${articleTagData.length}件の記事タグ関連付けを作成しました`);

		console.log("🎉 200件シードデータの作成が完了しました！");
		console.log(`
📊 作成されたデータ:
- ユーザー: 1件
- タグ: ${tagData.length}件
- タグ翻訳: ${tagTranslationData.length}件
- 記事: ${articleData.length}件
- 記事翻訳: ${articleTranslationData.length}件
- 記事タグ関連付け: ${articleTagData.length}件
		`);

	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

// スクリプトを実行
seed().catch(console.error);