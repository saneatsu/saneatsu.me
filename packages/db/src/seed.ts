/**
 * データベースのシードデータ生成スクリプト
 */
import dotenv from "dotenv";

// 環境変数をロード（最初に実行）
dotenv.config();

import { createClient } from "@libsql/client";
import { and, eq } from "drizzle-orm";
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

async function seed() {
	console.log("🌱 シードデータの作成を開始します...");

	try {
		// 既存のユーザーをチェック
		let user = await db
			.select()
			.from(users)
			.where(eq(users.email, "test@example.com"))
			.limit(1);

		if (user.length === 0) {
			// ユーザーを作成
			const [newUser] = await db
				.insert(users)
				.values({
					email: "test@example.com",
					name: "テストユーザー",
					avatarUrl: "https://github.com/identicons/test.png",
					provider: "google",
					providerId: "123456789",
				})
				.returning();
			user = [newUser];
			console.log("✅ 新しいユーザーを作成しました");
		} else {
			console.log("✅ 既存のユーザーを使用します");
		}

		// タグを取得または作成
		const tagSlugs = ["tech", "life", "development"];
		const tagData = [];

		for (const slug of tagSlugs) {
			const tag = await db
				.select()
				.from(tags)
				.where(eq(tags.slug, slug))
				.limit(1);

			if (tag.length === 0) {
				const [newTag] = await db.insert(tags).values({ slug }).returning();
				tagData.push(newTag);
			} else {
				tagData.push(tag[0]);
			}
		}

		const [techTag, lifeTag, devTag] = tagData;
		console.log("✅ タグを準備しました");

		// タグの翻訳を作成（重複チェック）
		const tagTranslationData = [
			{ tagId: techTag.id, name: "技術", language: "ja" as const },
			{ tagId: techTag.id, name: "Technology", language: "en" as const },
			{ tagId: lifeTag.id, name: "ライフスタイル", language: "ja" as const },
			{ tagId: lifeTag.id, name: "Lifestyle", language: "en" as const },
			{ tagId: devTag.id, name: "開発", language: "ja" as const },
			{ tagId: devTag.id, name: "Development", language: "en" as const },
		];

		for (const translation of tagTranslationData) {
			const existing = await db
				.select()
				.from(tagTranslations)
				.where(
					and(
						eq(tagTranslations.tagId, translation.tagId),
						eq(tagTranslations.language, translation.language)
					)
				)
				.limit(1);

			if (existing.length === 0) {
				await db.insert(tagTranslations).values(translation);
			}
		}

		console.log("✅ タグの翻訳を準備しました");

		// 記事を取得または作成
		const articleSlugs = ["hello-world", "typescript-tips", "life-in-2024"];
		const articleData = [];

		for (const slug of articleSlugs) {
			const article = await db
				.select()
				.from(articles)
				.where(eq(articles.slug, slug))
				.limit(1);

			if (article.length === 0) {
				const [newArticle] = await db
					.insert(articles)
					.values({
						slug,
						status: "published",
						publishedAt: new Date().toISOString(),
					})
					.returning();
				articleData.push(newArticle);
			} else {
				articleData.push(article[0]);
			}
		}

		const [article1, article2, article3] = articleData;
		console.log("✅ 記事を準備しました");

		// 記事の翻訳を作成（重複チェック）
		const articleTranslationData = [
			{
				articleId: article1.id,
				title: "こんにちは世界",
				content:
					"# こんにちは世界\n\nこれは最初のブログ記事です。\n\n## はじめに\n\nMarkdownで書かれた記事のサンプルです。",
				language: "ja" as const,
			},
			{
				articleId: article1.id,
				title: "Hello World",
				content:
					"# Hello World\n\nThis is the first blog post.\n\n## Introduction\n\nThis is a sample article written in Markdown.",
				language: "en" as const,
			},
			{
				articleId: article2.id,
				title: "TypeScriptの便利なテクニック",
				content:
					"# TypeScriptの便利なテクニック\n\n## 型推論を活用する\n\nTypeScriptの強力な型推論を使いこなしましょう。\n\n```typescript\nconst user = {\n  name: 'Taro',\n  age: 25\n};\n// userの型は自動的に推論される\n```",
				language: "ja" as const,
			},
			{
				articleId: article2.id,
				title: "Useful TypeScript Tips",
				content:
					"# Useful TypeScript Tips\n\n## Leveraging Type Inference\n\nMake the most of TypeScript's powerful type inference.\n\n```typescript\nconst user = {\n  name: 'Taro',\n  age: 25\n};\n// The type of user is automatically inferred\n```",
				language: "en" as const,
			},
			{
				articleId: article3.id,
				title: "2024年の生活",
				content:
					"# 2024年の生活\n\n今年の目標と振り返りについて書きます。\n\n## 目標\n\n- 健康的な生活\n- 新しい技術の学習\n- 趣味の充実",
				language: "ja" as const,
			},
			{
				articleId: article3.id,
				title: "Life in 2024",
				content:
					"# Life in 2024\n\nWriting about goals and reflections for this year.\n\n## Goals\n\n- Healthy lifestyle\n- Learning new technologies\n- Enriching hobbies",
				language: "en" as const,
			},
		];

		for (const translation of articleTranslationData) {
			const existing = await db
				.select()
				.from(articleTranslations)
				.where(
					and(
						eq(articleTranslations.articleId, translation.articleId),
						eq(articleTranslations.language, translation.language)
					)
				)
				.limit(1);

			if (existing.length === 0) {
				await db.insert(articleTranslations).values(translation);
			}
		}

		console.log("✅ 記事の翻訳を準備しました");

		// 記事とタグの関連付け（重複チェック）
		const articleTagData = [
			{ articleId: article1.id, tagId: techTag.id },
			{ articleId: article1.id, tagId: devTag.id },
			{ articleId: article2.id, tagId: techTag.id },
			{ articleId: article2.id, tagId: devTag.id },
			{ articleId: article3.id, tagId: lifeTag.id },
		];

		for (const articleTag of articleTagData) {
			const existing = await db
				.select()
				.from(articleTags)
				.where(
					and(
						eq(articleTags.articleId, articleTag.articleId),
						eq(articleTags.tagId, articleTag.tagId)
					)
				)
				.limit(1);

			if (existing.length === 0) {
				await db.insert(articleTags).values(articleTag);
			}
		}

		console.log("✅ 記事とタグを関連付けました");

		console.log("🎉 シードデータの作成が完了しました！");
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

// スクリプトを実行
seed().catch(console.error);
