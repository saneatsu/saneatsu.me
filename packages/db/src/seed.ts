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
		const tagSlugs = [
			"tech",
			"life",
			"development",
			"web",
			"database",
			"ai",
			"design",
		];
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

		const [techTag, lifeTag, devTag, webTag, dbTag, aiTag, designTag] = tagData;
		console.log("✅ タグを準備しました");

		// タグの翻訳を作成（重複チェック）
		const tagTranslationData = [
			{ tagId: techTag.id, name: "技術", language: "ja" as const },
			{ tagId: techTag.id, name: "Technology", language: "en" as const },
			{ tagId: lifeTag.id, name: "ライフスタイル", language: "ja" as const },
			{ tagId: lifeTag.id, name: "Lifestyle", language: "en" as const },
			{ tagId: devTag.id, name: "開発", language: "ja" as const },
			{ tagId: devTag.id, name: "Development", language: "en" as const },
			{ tagId: webTag.id, name: "ウェブ", language: "ja" as const },
			{ tagId: webTag.id, name: "Web", language: "en" as const },
			{ tagId: dbTag.id, name: "データベース", language: "ja" as const },
			{ tagId: dbTag.id, name: "Database", language: "en" as const },
			{ tagId: aiTag.id, name: "AI・機械学習", language: "ja" as const },
			{ tagId: aiTag.id, name: "AI & ML", language: "en" as const },
			{ tagId: designTag.id, name: "デザイン", language: "ja" as const },
			{ tagId: designTag.id, name: "Design", language: "en" as const },
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
		const articleDefinitions = [
			{
				slug: "hello-world",
				status: "published" as const,
				publishedAt: new Date("2024-01-01T09:00:00Z").toISOString(),
				cfImageId: null,
			},
			{
				slug: "typescript-tips",
				status: "published" as const,
				publishedAt: new Date("2024-02-15T10:30:00Z").toISOString(),
				cfImageId: "typescript-tips-hero",
			},
			{
				slug: "life-in-2024",
				status: "published" as const,
				publishedAt: new Date("2024-03-20T14:00:00Z").toISOString(),
				cfImageId: null,
			},
			{
				slug: "nextjs-15-features",
				status: "published" as const,
				publishedAt: new Date("2024-04-10T08:00:00Z").toISOString(),
				cfImageId: "nextjs-15-hero",
			},
			{
				slug: "database-design-best-practices",
				status: "published" as const,
				publishedAt: new Date("2024-05-05T11:30:00Z").toISOString(),
				cfImageId: "database-design-hero",
			},
			{
				slug: "ai-powered-development",
				status: "published" as const,
				publishedAt: new Date("2024-06-12T09:15:00Z").toISOString(),
				cfImageId: "ai-development-hero",
			},
			{
				slug: "modern-css-techniques",
				status: "published" as const,
				publishedAt: new Date("2024-07-08T13:45:00Z").toISOString(),
				cfImageId: null,
			},
			{
				slug: "remote-work-tips",
				status: "published" as const,
				publishedAt: new Date("2024-08-22T10:00:00Z").toISOString(),
				cfImageId: "remote-work-hero",
			},
			{
				slug: "react-19-overview",
				status: "draft" as const,
				publishedAt: null,
				cfImageId: "react-19-hero",
			},
			{
				slug: "coding-interview-prep",
				status: "draft" as const,
				publishedAt: null,
				cfImageId: null,
			},
			{
				slug: "web-performance-optimization",
				status: "published" as const,
				publishedAt: new Date("2024-09-30T15:20:00Z").toISOString(),
				cfImageId: "web-performance-hero",
			},
			{
				slug: "design-system-implementation",
				status: "published" as const,
				publishedAt: new Date("2024-10-25T11:00:00Z").toISOString(),
				cfImageId: "design-system-hero",
			},
		];

		const articleData = [];

		for (const articleDef of articleDefinitions) {
			const article = await db
				.select()
				.from(articles)
				.where(eq(articles.slug, articleDef.slug))
				.limit(1);

			if (article.length === 0) {
				const [newArticle] = await db
					.insert(articles)
					.values(articleDef)
					.returning();
				articleData.push(newArticle);
			} else {
				articleData.push(article[0]);
			}
		}

		const [
			article1,
			article2,
			article3,
			article4,
			article5,
			article6,
			article7,
			article8,
			article9,
			article10,
			article11,
			article12,
		] = articleData;
		console.log("✅ 記事を準備しました");

		// 記事の翻訳を作成（重複チェック）
		const articleTranslationData = [
			// 記事1: Hello World
			{
				articleId: article1.id,
				title: "こんにちは世界",
				content:
					"# こんにちは世界\n\nこれは最初のブログ記事です。\n\n## はじめに\n\nMarkdownで書かれた記事のサンプルです。\n\n## なぜブログを始めたのか\n\n技術的な知識を共有し、コミュニティに貢献したいと思ったからです。これからも定期的に記事を投稿していきます。\n\n## 今後の予定\n\n- TypeScriptの高度な使い方\n- Next.jsのベストプラクティス\n- データベース設計の基礎\n\nぜひ、またチェックしに来てください！",
				language: "ja" as const,
			},
			{
				articleId: article1.id,
				title: "Hello World",
				content:
					"# Hello World\n\nThis is the first blog post.\n\n## Introduction\n\nThis is a sample article written in Markdown.\n\n## Why I Started This Blog\n\nI wanted to share my technical knowledge and contribute to the community. I plan to post articles regularly.\n\n## Future Topics\n\n- Advanced TypeScript techniques\n- Next.js best practices\n- Database design fundamentals\n\nPlease come back and check for new content!",
				language: "en" as const,
			},
			// 記事2: TypeScript Tips
			{
				articleId: article2.id,
				title: "TypeScriptの便利なテクニック",
				content:
					"# TypeScriptの便利なテクニック\n\n## 型推論を活用する\n\nTypeScriptの強力な型推論を使いこなしましょう。\n\n```typescript\nconst user = {\n  name: 'Taro',\n  age: 25\n};\n// userの型は自動的に推論される\n```\n\n## ジェネリクスの活用\n\n```typescript\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n\nconst result = identity<string>('hello');\n```\n\n## 型ガードの実装\n\n```typescript\nfunction isString(value: unknown): value is string {\n  return typeof value === 'string';\n}\n```\n\n## まとめ\n\nTypeScriptの型システムを理解することで、より安全で保守性の高いコードを書くことができます。",
				language: "ja" as const,
			},
			{
				articleId: article2.id,
				title: "Useful TypeScript Tips",
				content:
					"# Useful TypeScript Tips\n\n## Leveraging Type Inference\n\nMake the most of TypeScript's powerful type inference.\n\n```typescript\nconst user = {\n  name: 'Taro',\n  age: 25\n};\n// The type of user is automatically inferred\n```\n\n## Using Generics\n\n```typescript\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n\nconst result = identity<string>('hello');\n```\n\n## Implementing Type Guards\n\n```typescript\nfunction isString(value: unknown): value is string {\n  return typeof value === 'string';\n}\n```\n\n## Summary\n\nUnderstanding TypeScript's type system enables you to write safer and more maintainable code.",
				language: "en" as const,
			},
			// 記事3: Life in 2024
			{
				articleId: article3.id,
				title: "2024年の生活",
				content:
					"# 2024年の生活\n\n今年の目標と振り返りについて書きます。\n\n## 目標\n\n- 健康的な生活\n- 新しい技術の学習\n- 趣味の充実\n\n## 上半期の振り返り\n\n### 健康面\n\n毎日のウォーキングを習慣化し、体重も3kg減らすことができました。食事も野菜中心のメニューに切り替えています。\n\n### 技術学習\n\nNext.js 15の新機能を習得し、実際のプロジェクトに導入しました。また、AIツールを使った開発も積極的に行っています。\n\n### 趣味\n\n週末は写真撮影を楽しんでいます。新しいレンズも購入し、風景写真のスキルが向上しました。\n\n## 下半期の計画\n\n残り半年でさらなる成長を目指します。",
				language: "ja" as const,
			},
			{
				articleId: article3.id,
				title: "Life in 2024",
				content:
					"# Life in 2024\n\nWriting about goals and reflections for this year.\n\n## Goals\n\n- Healthy lifestyle\n- Learning new technologies\n- Enriching hobbies\n\n## First Half Review\n\n### Health\n\nI've made daily walking a habit and lost 3kg. I've also switched to a vegetable-centered diet.\n\n### Technical Learning\n\nI've mastered Next.js 15's new features and implemented them in real projects. I'm also actively using AI tools in development.\n\n### Hobbies\n\nI enjoy photography on weekends. I bought a new lens and improved my landscape photography skills.\n\n## Second Half Plans\n\nAiming for further growth in the remaining six months.",
				language: "en" as const,
			},
			// 記事4: Next.js 15 Features
			{
				articleId: article4.id,
				title: "Next.js 15の新機能まとめ",
				content:
					"# Next.js 15の新機能まとめ\n\n## Server Actions の改善\n\nNext.js 15では、Server Actionsがより使いやすくなりました。\n\n```typescript\nasync function updateUser(formData: FormData) {\n  'use server'\n  \n  const name = formData.get('name')\n  // データベース更新処理\n}\n```\n\n## パフォーマンスの向上\n\n- ビルド時間が30%短縮\n- 開発サーバーの起動速度が改善\n- バンドルサイズの最適化\n\n## 新しいキャッシュ戦略\n\n```typescript\nexport const revalidate = 3600 // 1時間\n```\n\n## TypeScriptサポートの強化\n\n型定義がより正確になり、開発体験が向上しました。",
				language: "ja" as const,
			},
			{
				articleId: article4.id,
				title: "Next.js 15 New Features Summary",
				content:
					"# Next.js 15 New Features Summary\n\n## Server Actions Improvements\n\nServer Actions are now easier to use in Next.js 15.\n\n```typescript\nasync function updateUser(formData: FormData) {\n  'use server'\n  \n  const name = formData.get('name')\n  // Database update logic\n}\n```\n\n## Performance Improvements\n\n- 30% faster build times\n- Improved dev server startup speed\n- Optimized bundle sizes\n\n## New Caching Strategy\n\n```typescript\nexport const revalidate = 3600 // 1 hour\n```\n\n## Enhanced TypeScript Support\n\nMore accurate type definitions for a better development experience.",
				language: "en" as const,
			},
			// 記事5: Database Design
			{
				articleId: article5.id,
				title: "データベース設計のベストプラクティス",
				content:
					"# データベース設計のベストプラクティス\n\n## 正規化の重要性\n\nデータの重複を避け、整合性を保つために正規化は重要です。\n\n### 第1正規形\n\n- 各列に単一の値のみを持つ\n- 繰り返しグループを排除\n\n### 第2正規形\n\n- 第1正規形を満たす\n- 部分的関数従属を排除\n\n### 第3正規形\n\n- 第2正規形を満たす\n- 推移的関数従属を排除\n\n## インデックスの設計\n\n```sql\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_posts_user_id ON posts(user_id);\n```\n\n## トランザクションの活用\n\n```sql\nBEGIN TRANSACTION;\n-- 複数の操作\nCOMMIT;\n```",
				language: "ja" as const,
			},
			{
				articleId: article5.id,
				title: "Database Design Best Practices",
				content:
					"# Database Design Best Practices\n\n## The Importance of Normalization\n\nNormalization is crucial to avoid data redundancy and maintain consistency.\n\n### First Normal Form\n\n- Each column contains only single values\n- Eliminate repeating groups\n\n### Second Normal Form\n\n- Meets 1NF requirements\n- Eliminate partial dependencies\n\n### Third Normal Form\n\n- Meets 2NF requirements\n- Eliminate transitive dependencies\n\n## Index Design\n\n```sql\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_posts_user_id ON posts(user_id);\n```\n\n## Using Transactions\n\n```sql\nBEGIN TRANSACTION;\n-- Multiple operations\nCOMMIT;\n```",
				language: "en" as const,
			},
			// 記事6: AI Development
			{
				articleId: article6.id,
				title: "AIを活用した開発効率化",
				content:
					"# AIを活用した開発効率化\n\n## GitHub Copilotの活用\n\nコード補完だけでなく、関数全体の生成も可能です。\n\n```typescript\n// コメントを書くだけで関数を生成\n// ユーザーの年齢から世代を判定する関数\nfunction getGeneration(age: number): string {\n  if (age < 20) return 'Z世代';\n  if (age < 40) return 'ミレニアル世代';\n  if (age < 60) return 'X世代';\n  return 'ベビーブーマー世代';\n}\n```\n\n## ChatGPTでのコードレビュー\n\n- バグの早期発見\n- パフォーマンス改善の提案\n- セキュリティ問題の指摘\n\n## AIツールの選び方\n\n1. タスクに適したツールを選ぶ\n2. 精度と速度のバランスを考慮\n3. コストパフォーマンスを評価",
				language: "ja" as const,
			},
			{
				articleId: article6.id,
				title: "Improving Development Efficiency with AI",
				content:
					"# Improving Development Efficiency with AI\n\n## Using GitHub Copilot\n\nNot just code completion, but entire function generation.\n\n```typescript\n// Generate function from comment\n// Function to determine generation from user's age\nfunction getGeneration(age: number): string {\n  if (age < 20) return 'Gen Z';\n  if (age < 40) return 'Millennials';\n  if (age < 60) return 'Gen X';\n  return 'Baby Boomers';\n}\n```\n\n## Code Review with ChatGPT\n\n- Early bug detection\n- Performance improvement suggestions\n- Security issue identification\n\n## Choosing AI Tools\n\n1. Select tools suitable for the task\n2. Consider accuracy vs speed balance\n3. Evaluate cost-performance ratio",
				language: "en" as const,
			},
			// 記事7: CSS Techniques
			{
				articleId: article7.id,
				title: "モダンCSSテクニック",
				content:
					"# モダンCSSテクニック\n\n## CSS Gridの活用\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n  gap: 20px;\n}\n```\n\n## CSS変数の活用\n\n```css\n:root {\n  --primary-color: #007bff;\n  --secondary-color: #6c757d;\n  --spacing: 16px;\n}\n\n.button {\n  background-color: var(--primary-color);\n  padding: var(--spacing);\n}\n```\n\n## コンテナクエリ\n\n```css\n@container (min-width: 400px) {\n  .card {\n    display: flex;\n  }\n}\n```\n\n## まとめ\n\nモダンCSSを使いこなすことで、より柔軟で保守性の高いスタイルを実現できます。",
				language: "ja" as const,
			},
			{
				articleId: article7.id,
				title: "Modern CSS Techniques",
				content:
					"# Modern CSS Techniques\n\n## Using CSS Grid\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n  gap: 20px;\n}\n```\n\n## Using CSS Variables\n\n```css\n:root {\n  --primary-color: #007bff;\n  --secondary-color: #6c757d;\n  --spacing: 16px;\n}\n\n.button {\n  background-color: var(--primary-color);\n  padding: var(--spacing);\n}\n```\n\n## Container Queries\n\n```css\n@container (min-width: 400px) {\n  .card {\n    display: flex;\n  }\n}\n```\n\n## Summary\n\nMastering modern CSS enables more flexible and maintainable styles.",
				language: "en" as const,
			},
			// 記事8: Remote Work
			{
				articleId: article8.id,
				title: "リモートワークを成功させるコツ",
				content:
					"# リモートワークを成功させるコツ\n\n## 環境づくり\n\n### デスク環境\n\n- エルゴノミクスチェア\n- 外部モニター\n- 適切な照明\n\n### ツール選び\n\n- コミュニケーション: Slack, Discord\n- ビデオ会議: Zoom, Google Meet\n- タスク管理: Notion, Trello\n\n## 時間管理\n\n### ポモドーロテクニック\n\n1. 25分集中して作業\n2. 5分休憩\n3. 4セット後に長めの休憩\n\n### タイムボックス\n\n各タスクに時間を割り当てて効率化\n\n## コミュニケーション\n\n- 過剰なくらいに共有する\n- 非同期コミュニケーションを活用\n- 定期的な1on1の実施",
				language: "ja" as const,
			},
			{
				articleId: article8.id,
				title: "Tips for Successful Remote Work",
				content:
					"# Tips for Successful Remote Work\n\n## Creating the Environment\n\n### Desk Setup\n\n- Ergonomic chair\n- External monitor\n- Proper lighting\n\n### Tool Selection\n\n- Communication: Slack, Discord\n- Video conferencing: Zoom, Google Meet\n- Task management: Notion, Trello\n\n## Time Management\n\n### Pomodoro Technique\n\n1. Focus for 25 minutes\n2. 5-minute break\n3. Longer break after 4 sets\n\n### Time Boxing\n\nAllocate specific time for each task\n\n## Communication\n\n- Over-communicate rather than under\n- Utilize asynchronous communication\n- Regular 1-on-1 meetings",
				language: "en" as const,
			},
			// 記事9: React 19 (Draft)
			{
				articleId: article9.id,
				title: "React 19の新機能を先取り",
				content:
					"# React 19の新機能を先取り\n\n## 新しいHooks\n\n### use() Hook\n\n```typescript\nfunction Profile({ userId }) {\n  const user = use(fetchUser(userId));\n  return <h1>{user.name}</h1>;\n}\n```\n\n## サーバーコンポーネントの進化\n\n- より柔軟なデータフェッチング\n- ストリーミングの改善\n- エラーハンドリングの向上\n\n## パフォーマンス改善\n\n- 自動バッチングの最適化\n- メモリ使用量の削減\n- 初期ロードの高速化\n\n*注: この記事は下書きです。React 19の正式リリース後に更新予定です。*",
				language: "ja" as const,
			},
			{
				articleId: article9.id,
				title: "Preview of React 19 Features",
				content:
					"# Preview of React 19 Features\n\n## New Hooks\n\n### use() Hook\n\n```typescript\nfunction Profile({ userId }) {\n  const user = use(fetchUser(userId));\n  return <h1>{user.name}</h1>;\n}\n```\n\n## Server Components Evolution\n\n- More flexible data fetching\n- Improved streaming\n- Better error handling\n\n## Performance Improvements\n\n- Optimized automatic batching\n- Reduced memory usage\n- Faster initial load\n\n*Note: This article is a draft. Will be updated after React 19's official release.*",
				language: "en" as const,
			},
			// 記事10: Interview Prep (Draft)
			{
				articleId: article10.id,
				title: "コーディング面接の準備方法",
				content:
					"# コーディング面接の準備方法\n\n## 基本的なアルゴリズム\n\n### ソートアルゴリズム\n\n- バブルソート\n- クイックソート\n- マージソート\n\n### データ構造\n\n- 配列とリンクリスト\n- スタックとキュー\n- 木構造とグラフ\n\n## 練習方法\n\n1. LeetCodeで毎日1問\n2. 時間を計って解く\n3. 複数の解法を考える\n\n*注: この記事は作成中です。*",
				language: "ja" as const,
			},
			{
				articleId: article10.id,
				title: "How to Prepare for Coding Interviews",
				content:
					"# How to Prepare for Coding Interviews\n\n## Basic Algorithms\n\n### Sorting Algorithms\n\n- Bubble Sort\n- Quick Sort\n- Merge Sort\n\n### Data Structures\n\n- Arrays and Linked Lists\n- Stacks and Queues\n- Trees and Graphs\n\n## Practice Methods\n\n1. One LeetCode problem daily\n2. Solve with time constraints\n3. Consider multiple approaches\n\n*Note: This article is under construction.*",
				language: "en" as const,
			},
			// 記事11: Web Performance
			{
				articleId: article11.id,
				title: "Webパフォーマンス最適化の実践",
				content:
					"# Webパフォーマンス最適化の実践\n\n## Core Web Vitals\n\n### LCP (Largest Contentful Paint)\n\n- 画像の最適化\n- CDNの活用\n- 重要なリソースの事前読み込み\n\n### FID (First Input Delay)\n\n- JavaScriptの実行時間を短縮\n- Web Workersの活用\n- イベントハンドラの最適化\n\n### CLS (Cumulative Layout Shift)\n\n- 画像とビデオのサイズ指定\n- フォントの事前読み込み\n- 動的コンテンツの適切な配置\n\n## 実装例\n\n```javascript\n// 画像の遅延読み込み\nconst images = document.querySelectorAll('img[data-src]');\nconst imageObserver = new IntersectionObserver((entries) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      const img = entry.target;\n      img.src = img.dataset.src;\n      imageObserver.unobserve(img);\n    }\n  });\n});\n```",
				language: "ja" as const,
			},
			{
				articleId: article11.id,
				title: "Practical Web Performance Optimization",
				content:
					"# Practical Web Performance Optimization\n\n## Core Web Vitals\n\n### LCP (Largest Contentful Paint)\n\n- Image optimization\n- CDN utilization\n- Critical resource preloading\n\n### FID (First Input Delay)\n\n- Reduce JavaScript execution time\n- Utilize Web Workers\n- Optimize event handlers\n\n### CLS (Cumulative Layout Shift)\n\n- Specify image and video dimensions\n- Font preloading\n- Proper dynamic content placement\n\n## Implementation Example\n\n```javascript\n// Lazy loading images\nconst images = document.querySelectorAll('img[data-src]');\nconst imageObserver = new IntersectionObserver((entries) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      const img = entry.target;\n      img.src = img.dataset.src;\n      imageObserver.unobserve(img);\n    }\n  });\n});\n```",
				language: "en" as const,
			},
			// 記事12: Design System
			{
				articleId: article12.id,
				title: "デザインシステムの実装と運用",
				content:
					"# デザインシステムの実装と運用\n\n## デザイントークンの定義\n\n```css\n:root {\n  /* Colors */\n  --color-primary-500: #007bff;\n  --color-neutral-100: #f8f9fa;\n  \n  /* Spacing */\n  --space-xs: 4px;\n  --space-sm: 8px;\n  --space-md: 16px;\n  \n  /* Typography */\n  --font-size-base: 16px;\n  --line-height-base: 1.5;\n}\n```\n\n## コンポーネントライブラリ\n\n### Storybookの活用\n\n```typescript\nexport default {\n  title: 'Components/Button',\n  component: Button,\n  argTypes: {\n    variant: {\n      control: { type: 'select' },\n      options: ['primary', 'secondary', 'danger']\n    }\n  }\n};\n```\n\n## ドキュメンテーション\n\n- 使用ガイドライン\n- アクセシビリティ要件\n- 実装例とベストプラクティス",
				language: "ja" as const,
			},
			{
				articleId: article12.id,
				title: "Implementing and Managing Design Systems",
				content:
					"# Implementing and Managing Design Systems\n\n## Defining Design Tokens\n\n```css\n:root {\n  /* Colors */\n  --color-primary-500: #007bff;\n  --color-neutral-100: #f8f9fa;\n  \n  /* Spacing */\n  --space-xs: 4px;\n  --space-sm: 8px;\n  --space-md: 16px;\n  \n  /* Typography */\n  --font-size-base: 16px;\n  --line-height-base: 1.5;\n}\n```\n\n## Component Library\n\n### Using Storybook\n\n```typescript\nexport default {\n  title: 'Components/Button',\n  component: Button,\n  argTypes: {\n    variant: {\n      control: { type: 'select' },\n      options: ['primary', 'secondary', 'danger']\n    }\n  }\n};\n```\n\n## Documentation\n\n- Usage guidelines\n- Accessibility requirements\n- Implementation examples and best practices",
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
			// 記事1: Hello World
			{ articleId: article1.id, tagId: techTag.id },
			{ articleId: article1.id, tagId: devTag.id },
			// 記事2: TypeScript Tips
			{ articleId: article2.id, tagId: techTag.id },
			{ articleId: article2.id, tagId: devTag.id },
			// 記事3: Life in 2024
			{ articleId: article3.id, tagId: lifeTag.id },
			// 記事4: Next.js 15
			{ articleId: article4.id, tagId: techTag.id },
			{ articleId: article4.id, tagId: webTag.id },
			{ articleId: article4.id, tagId: devTag.id },
			// 記事5: Database Design
			{ articleId: article5.id, tagId: techTag.id },
			{ articleId: article5.id, tagId: dbTag.id },
			// 記事6: AI Development
			{ articleId: article6.id, tagId: techTag.id },
			{ articleId: article6.id, tagId: aiTag.id },
			{ articleId: article6.id, tagId: devTag.id },
			// 記事7: CSS Techniques
			{ articleId: article7.id, tagId: techTag.id },
			{ articleId: article7.id, tagId: webTag.id },
			{ articleId: article7.id, tagId: designTag.id },
			// 記事8: Remote Work
			{ articleId: article8.id, tagId: lifeTag.id },
			// 記事9: React 19 (Draft)
			{ articleId: article9.id, tagId: techTag.id },
			{ articleId: article9.id, tagId: webTag.id },
			{ articleId: article9.id, tagId: devTag.id },
			// 記事10: Interview Prep (Draft)
			{ articleId: article10.id, tagId: techTag.id },
			{ articleId: article10.id, tagId: devTag.id },
			// 記事11: Web Performance
			{ articleId: article11.id, tagId: techTag.id },
			{ articleId: article11.id, tagId: webTag.id },
			// 記事12: Design System
			{ articleId: article12.id, tagId: techTag.id },
			{ articleId: article12.id, tagId: designTag.id },
			{ articleId: article12.id, tagId: devTag.id },
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
