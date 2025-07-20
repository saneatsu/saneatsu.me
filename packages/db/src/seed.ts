/**
 * データベースのシードデータ生成スクリプト
 */
import dotenv from "dotenv";

// 環境変数をロード（最初に実行）
dotenv.config();

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { users, articles, articleTranslations, tags, tagTranslations, articleTags } from "./schema";

// シード用のデータベース接続（直接作成）
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

async function seed() {
	console.log("🌱 シードデータの作成を開始します...");

	try {
		// ユーザーを作成
		const [user] = await db.insert(users).values({
			email: "test@example.com",
			name: "テストユーザー",
			avatarUrl: "https://github.com/identicons/test.png",
			provider: "google",
			providerId: "123456789",
		}).returning();

		console.log("✅ ユーザーを作成しました");

		// タグを作成
		const [techTag] = await db.insert(tags).values({
			slug: "tech",
		}).returning();

		const [lifeTag] = await db.insert(tags).values({
			slug: "life",
		}).returning();

		const [devTag] = await db.insert(tags).values({
			slug: "development",
		}).returning();

		console.log("✅ タグを作成しました");

		// タグの翻訳を作成
		await db.insert(tagTranslations).values([
			{ tagId: techTag.id, name: "技術", language: "ja" },
			{ tagId: techTag.id, name: "Technology", language: "en" },
			{ tagId: lifeTag.id, name: "ライフスタイル", language: "ja" },
			{ tagId: lifeTag.id, name: "Lifestyle", language: "en" },
			{ tagId: devTag.id, name: "開発", language: "ja" },
			{ tagId: devTag.id, name: "Development", language: "en" },
		]);

		console.log("✅ タグの翻訳を作成しました");

		// 記事を作成
		const [article1] = await db.insert(articles).values({
			slug: "hello-world",
			status: "published",
			publishedAt: new Date().toISOString(),
		}).returning();

		const [article2] = await db.insert(articles).values({
			slug: "typescript-tips",
			status: "published",
			publishedAt: new Date().toISOString(),
		}).returning();

		const [article3] = await db.insert(articles).values({
			slug: "life-in-2024",
			status: "published",
			publishedAt: new Date().toISOString(),
		}).returning();

		console.log("✅ 記事を作成しました");

		// 記事の翻訳を作成
		await db.insert(articleTranslations).values([
			{
				articleId: article1.id,
				title: "こんにちは世界",
				content: "# こんにちは世界\n\nこれは最初のブログ記事です。\n\n## はじめに\n\nMarkdownで書かれた記事のサンプルです。",
				language: "ja",
			},
			{
				articleId: article1.id,
				title: "Hello World",
				content: "# Hello World\n\nThis is the first blog post.\n\n## Introduction\n\nThis is a sample article written in Markdown.",
				language: "en",
			},
			{
				articleId: article2.id,
				title: "TypeScriptの便利なテクニック",
				content: "# TypeScriptの便利なテクニック\n\n## 型推論を活用する\n\nTypeScriptの強力な型推論を使いこなしましょう。\n\n```typescript\nconst user = {\n  name: 'Taro',\n  age: 25\n};\n// userの型は自動的に推論される\n```",
				language: "ja",
			},
			{
				articleId: article2.id,
				title: "Useful TypeScript Tips",
				content: "# Useful TypeScript Tips\n\n## Leveraging Type Inference\n\nMake the most of TypeScript's powerful type inference.\n\n```typescript\nconst user = {\n  name: 'Taro',\n  age: 25\n};\n// The type of user is automatically inferred\n```",
				language: "en",
			},
			{
				articleId: article3.id,
				title: "2024年の生活",
				content: "# 2024年の生活\n\n今年の目標と振り返りについて書きます。\n\n## 目標\n\n- 健康的な生活\n- 新しい技術の学習\n- 趣味の充実",
				language: "ja",
			},
			{
				articleId: article3.id,
				title: "Life in 2024",
				content: "# Life in 2024\n\nWriting about goals and reflections for this year.\n\n## Goals\n\n- Healthy lifestyle\n- Learning new technologies\n- Enriching hobbies",
				language: "en",
			},
		]);

		console.log("✅ 記事の翻訳を作成しました");

		// 記事とタグの関連付け
		await db.insert(articleTags).values([
			{ articleId: article1.id, tagId: techTag.id },
			{ articleId: article1.id, tagId: devTag.id },
			{ articleId: article2.id, tagId: techTag.id },
			{ articleId: article2.id, tagId: devTag.id },
			{ articleId: article3.id, tagId: lifeTag.id },
		]);

		console.log("✅ 記事とタグを関連付けました");

		console.log("🎉 シードデータの作成が完了しました！");
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

// スクリプトを実行
seed().catch(console.error);